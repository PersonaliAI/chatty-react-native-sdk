import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, } from "react-native";
import { useChattyChat } from "./useChattyChat";
import { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle } from "./designTokens";
export function ChattyChatView(props) {
    const { theme, ready, messages, sending, aiPaused, error, sendText, sendImage } = useChattyChat(props);
    const [input, setInput] = useState("");
    const listRef = useRef(null);
    const designId = chattyNormalizeWidgetStyle(theme?.widget_style);
    const t = CHATTY_DESIGN_TOKENS[designId];
    // Every design's send button matches its user-bubble background on web —
    // reuse that as the "accent" for the send button and loading spinners.
    const accent = t.userBubbleBg;
    const lastMessageCount = useRef(0);
    React.useEffect(() => {
        if (ready)
            props.onReady?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);
    React.useEffect(() => {
        if (messages.length > lastMessageCount.current) {
            const newest = messages[messages.length - 1];
            if (newest.role !== "user")
                props.onMessage?.(newest);
            lastMessageCount.current = messages.length;
            requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);
    const handleSend = () => {
        const text = input.trim();
        if (!text || sending)
            return;
        setInput("");
        void sendText(text);
    };
    const handleStarter = (starter) => {
        if (sending)
            return;
        void sendText(starter);
    };
    if (!ready) {
        return (<View style={[styles.container, styles.center, { backgroundColor: t.containerBg }]}>
        <ActivityIndicator color={accent}/>
      </View>);
    }
    return (<KeyboardAvoidingView style={[styles.container, { backgroundColor: t.containerBg }]} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
      <View style={[styles.header, { backgroundColor: t.headerBg }]}>
        {theme?.logo_url ? (<Image source={{ uri: theme.logo_url }} style={styles.avatar}/>) : null}
        <Text style={[styles.headerTitle, { color: t.headerText }]} numberOfLines={1}>
          {theme?.name || "Chat"}
        </Text>
      </View>

      <FlatList ref={listRef} data={messages} keyExtractor={(m) => m.id} contentContainerStyle={styles.messageList} renderItem={({ item }) => <Bubble message={item} t={t}/>} ListFooterComponent={sending ? <TypingIndicator t={t} accent={accent}/> : null}/>

      {theme?.conversation_starters && theme.conversation_starters.length > 0 && messages.length <= 1 && (<View style={styles.starters}>
          {theme.conversation_starters.map((s, i) => (<TouchableOpacity key={i} style={[styles.starterChip, { borderColor: withAlpha(accent, 0.35) }]} onPress={() => handleStarter(s)}>
              <Text style={[styles.starterText, { color: accent }]} numberOfLines={2}>
                {s}
              </Text>
            </TouchableOpacity>))}
        </View>)}

      {aiPaused && (<View style={styles.banner}>
          <Text style={styles.bannerText}>A human agent has taken over this conversation.</Text>
        </View>)}
      {error && (<View style={[styles.banner, styles.errorBanner]}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>)}

      <View style={styles.composer}>
        <TouchableOpacity style={styles.attachButton} onPress={props.onAttachPress || (() => { })}>
          <Text style={styles.attachButtonText}>📎</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message…" placeholderTextColor="#9ca3af" multiline onSubmitEditing={handleSend}/>
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: accent, opacity: input.trim() ? 1 : 0.5 }]} onPress={handleSend} disabled={!input.trim() || sending}>
          <Text style={[styles.sendButtonText, { color: t.userBubbleText }]}>{"↑"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>);
}
/** Applies an alpha to a "#rrggbb" hex color; passes rgba()/other formats through unchanged. */
function withAlpha(hex, alpha) {
    if (!hex.startsWith("#") || hex.length !== 7)
        return hex;
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `${hex}${a}`;
}
function Bubble({ message, t }) {
    const isUser = message.role === "user";
    return (<View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View style={[
            styles.bubble,
            isUser
                ? { backgroundColor: t.userBubbleBg, borderRadius: t.userBubbleRadius, borderBottomRightRadius: 4 }
                : { backgroundColor: t.botBubbleBg, borderRadius: t.botBubbleRadius, borderBottomLeftRadius: 4 },
        ]}>
        {message.fileUrl ? <Image source={{ uri: message.fileUrl }} style={styles.attachedImage}/> : null}
        {message.text ? (isUser ? (<Text style={[styles.bubbleTextUser, { color: t.userBubbleText }]}>{message.text}</Text>) : (<SimpleMarkdown text={message.text} style={[styles.bubbleTextAssistant, { color: t.botBubbleText }]}/>)) : null}
      </View>
    </View>);
}
function TypingIndicator({ t, accent }) {
    return (<View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={[styles.bubble, { backgroundColor: t.botBubbleBg, borderRadius: t.botBubbleRadius }]}>
        <ActivityIndicator size="small" color={accent}/>
      </View>
    </View>);
}
function SimpleMarkdown({ text, style }) {
    const lines = text.split('\n');
    return (<View>
      {lines.map((line, i) => {
            let isList = false;
            if (line.startsWith('- ')) {
                isList = true;
                line = '  • ' + line.slice(2);
            }
            let isHeading = false;
            if (line.startsWith('### ')) {
                isHeading = true;
                line = line.slice(4);
            }
            const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
            const textStyle = isHeading ? { fontWeight: 'bold', fontSize: 16 } : undefined;
            return (<Text key={i} style={[style, textStyle]}>
            {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <Text key={j} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <Text key={j} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return <Text key={j} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', backgroundColor: '#f0f0f0' }}>{part.slice(1, -1)}</Text>;
                    }
                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                        return <Text key={j} style={{ color: '#007AFF', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(linkMatch[2])}>{linkMatch[1]}</Text>;
                    }
                    return <Text key={j}>{part}</Text>;
                })}
          </Text>);
        })}
    </View>);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
    },
    avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: "rgba(255,255,255,0.3)" },
    headerTitle: { color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
    messageList: { padding: 12, gap: 8 },
    bubbleRow: { flexDirection: "row", marginVertical: 3 },
    bubbleRowUser: { justifyContent: "flex-end" },
    bubbleRowAssistant: { justifyContent: "flex-start" },
    bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleTextUser: { color: "#fff", fontSize: 14, lineHeight: 20 },
    bubbleTextAssistant: { color: "#111827", fontSize: 14, lineHeight: 20 },
    attachedImage: { width: 180, height: 130, borderRadius: 10, marginBottom: 6 },
    starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
    starterChip: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: "100%",
    },
    starterText: { fontSize: 12.5, color: "#374151" },
    banner: { backgroundColor: "#fef3c7", paddingHorizontal: 14, paddingVertical: 8 },
    errorBanner: { backgroundColor: "#fee2e2" },
    bannerText: { fontSize: 11.5, color: "#374151" },
    composer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    input: {
        flex: 1,
        maxHeight: 100,
        backgroundColor: "#f9fafb",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    attachButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
    },
    attachButtonText: { fontSize: 20 },
});
