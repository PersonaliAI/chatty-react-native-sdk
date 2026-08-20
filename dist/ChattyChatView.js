import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Animated, LayoutAnimation, UIManager, } from "react-native";
import { useChattyChat } from "./useChattyChat";
import { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle, chattyBubbleRadii } from "./designTokens";
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
const CHATTY_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂", "🙃", "😉", "😊", "😇",
    "🥰", "😍", "🤩", "😘", "😋", "😛", "🤪", "😜", "🤔", "🤨", "😐", "😑",
    "😶", "🙄", "😏", "😒", "😬", "🙁", "😢", "😭", "😤", "😡", "🥳", "😴",
    "🤗", "🤝", "👍", "👎", "👏", "🙌", "🙏", "💪", "👋", "✌️", "🤞", "❤️",
    "🔥", "✨", "🎉", "🎊", "⭐", "💯", "✅", "❌", "❓", "❗", "💬", "👀",
];
/** bot/logo(no logoUrl)/custom(no avatarUrl) fall back to a generic chat
 * glyph; the rest map 1:1 to the dashboard's avatar_icon options. */
function avatarGlyph(avatarIcon) {
    switch (avatarIcon) {
        case "headset": return "🎧";
        case "sparkles": return "✨";
        case "message": return "💬";
        case "user": return "👤";
        default: return "🤖";
    }
}
function sendGlyph(style) {
    switch (style) {
        case "arrowUp": return "↑";
        case "arrowRight": return "→";
        case "square": return "➤";
        default: return "➤"; // "plane"/"label"
    }
}
const EASE_LAYOUT = LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity);
export function ChattyChatView(props) {
    const { theme, ready, messages, sending, aiPaused, error, sendText, sendImage, clearChat } = useChattyChat(props);
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const listRef = useRef(null);
    const designId = chattyNormalizeWidgetStyle(theme?.widget_style);
    const t = CHATTY_DESIGN_TOKENS[designId];
    // Every design's send button matches its user-bubble background on web —
    // reuse that as the "accent" for the send button and loading spinners.
    const accent = t.userBubbleBg;
    const lastMessageCount = useRef(0);
    useEffect(() => {
        if (ready)
            props.onReady?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);
    useEffect(() => {
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
        setShowEmojiPicker(false);
        setShowAttachMenu(false);
        void sendText(text);
    };
    const handleStarter = (starter) => {
        if (sending)
            return;
        void sendText(starter);
    };
    const toggleEmojiPicker = () => {
        LayoutAnimation.configureNext(EASE_LAYOUT);
        setShowAttachMenu(false);
        setShowEmojiPicker((v) => !v);
    };
    const toggleAttachMenu = () => {
        LayoutAnimation.configureNext(EASE_LAYOUT);
        setShowEmojiPicker(false);
        setShowAttachMenu((v) => !v);
    };
    if (!ready) {
        return (<View style={[styles.container, styles.center, { backgroundColor: t.containerBg }]}>
        <ActivityIndicator color={accent}/>
      </View>);
    }
    return (<KeyboardAvoidingView style={[styles.container, { backgroundColor: t.containerBg }]} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
      <View style={[styles.header, { backgroundColor: t.headerBg }]}>
        <View style={[styles.headerAvatar, { backgroundColor: withAlpha(t.headerText, 0.08) }]}>
          {theme?.logo_url ? (<Image source={{ uri: theme.logo_url }} style={styles.headerAvatarImage}/>) : (<Text style={{ fontSize: 20 }}>{avatarGlyph(theme?.avatar_icon)}</Text>)}
        </View>
        <View style={{ flexShrink: 1, flex: 1 }}>
          <Text style={[styles.headerTitle, { color: t.headerText }]} numberOfLines={1}>
            {theme?.name || "Chatty Assistant"}
          </Text>
          <View style={styles.headerStatusRow}>
            <PulsingDot color="#22c55e"/>
            <Text style={[styles.headerStatus, { color: withAlpha(t.headerText, 0.7) }]}>
              Online · replies instantly
            </Text>
          </View>
        </View>
        {theme?.voice_enabled ? (<TouchableOpacity style={styles.headerActionButton} onPress={() => props.onVoiceCallPress?.()}>
            <Text style={{ fontSize: 15 }}>📞</Text>
          </TouchableOpacity>) : null}
        <TouchableOpacity style={styles.headerActionButton} onPress={() => props.onNotificationBellPress?.()}>
          <Text style={{ fontSize: 15 }}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerActionButton} onPress={() => void clearChat()}>
          <Text style={{ fontSize: 15 }}>↺</Text>
        </TouchableOpacity>
      </View>

      <FlatList ref={listRef} data={messages} keyExtractor={(m) => m.id} contentContainerStyle={styles.messageList} renderItem={({ item }) => (<Bubble message={item} t={t} avatarIcon={theme?.avatar_icon} avatarUrl={theme?.avatar_url}/>)} ListFooterComponent={sending ? <TypingIndicator t={t} avatarIcon={theme?.avatar_icon} avatarUrl={theme?.avatar_url}/> : null}/>

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

      {/* Bordered rounded-16 bar with the input on top and an icon row
            (emoji + attach + mic + send) below, matching .chat-input-bar on web. */}
      <View style={[styles.composer, { borderColor: withAlpha(t.headerText, 0.12) }]}>
        {showEmojiPicker && (<View style={styles.emojiGrid}>
            {CHATTY_EMOJIS.map((emoji, i) => (<TouchableOpacity key={i} style={styles.emojiCell} onPress={() => setInput((v) => v + emoji)}>
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
              </TouchableOpacity>))}
          </View>)}
        {showAttachMenu && (<View style={styles.attachMenu}>
            <AttachMenuOption glyph="📷" label="Camera" onPress={() => {
                setShowAttachMenu(false);
                (props.onCameraPress || props.onAttachPress || (() => { }))();
            }}/>
            <AttachMenuOption glyph="🖼️" label="Photo Library" onPress={() => {
                setShowAttachMenu(false);
                (props.onPhotoLibraryPress || props.onAttachPress || (() => { }))();
            }}/>
          </View>)}

        <TextInput style={[styles.input, { color: t.botBubbleText }]} value={input} onChangeText={setInput} placeholder="Type a message…" placeholderTextColor="#9ca3af" multiline onSubmitEditing={handleSend}/>
        <View style={styles.composerIconRow}>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleEmojiPicker}>
              <Text style={styles.iconButtonText}>🙂</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={toggleAttachMenu}>
              <Text style={styles.iconButtonText}>📎</Text>
            </TouchableOpacity>
            {props.onMicPress ? (<TouchableOpacity style={styles.iconButton} onPress={() => props.onMicPress?.()}>
                <Text style={styles.iconButtonText}>🎤</Text>
              </TouchableOpacity>) : null}
          </View>
          <SendButton style={theme?.send_button_style} accent={accent} textColor={t.userBubbleText} enabled={!!input.trim() && !sending} onPress={handleSend}/>
        </View>
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
function PulsingDot({ color }) {
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [opacity]);
    return <Animated.View style={[styles.pulsingDot, { backgroundColor: color, opacity }]}/>;
}
function AttachMenuOption({ glyph, label, onPress }) {
    return (<TouchableOpacity style={styles.attachMenuOption} onPress={onPress}>
      <Text style={{ fontSize: 22 }}>{glyph}</Text>
      <Text style={styles.attachMenuOptionLabel}>{label}</Text>
    </TouchableOpacity>);
}
function BotAvatar({ t, avatarIcon, avatarUrl }) {
    return (<View style={[styles.bubbleAvatar, { backgroundColor: t.botBubbleBg }]}>
      {avatarIcon === "custom" && avatarUrl ? (<Image source={{ uri: avatarUrl }} style={styles.bubbleAvatarImage}/>) : (<Text style={{ fontSize: 12 }}>{avatarGlyph(avatarIcon)}</Text>)}
    </View>);
}
function SendButton({ style, accent, textColor, enabled, onPress, }) {
    const shapeStyle = style === "square" ? styles.sendButtonSquare :
        style === "label" ? styles.sendButtonLabel :
            styles.sendButtonRound;
    return (<TouchableOpacity style={[shapeStyle, { backgroundColor: accent, opacity: enabled ? 1 : 0.5 }]} onPress={onPress} disabled={!enabled}>
      {style === "label" ? (<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: textColor, fontSize: 14 }}>{sendGlyph(style)}</Text>
          <Text style={{ color: textColor, fontSize: 12, fontWeight: "600" }}>Send</Text>
        </View>) : (<Text style={[styles.sendButtonText, { color: textColor }]}>{sendGlyph(style)}</Text>)}
    </TouchableOpacity>);
}
function Bubble({ message, t, avatarIcon, avatarUrl, }) {
    const isUser = message.role === "user";
    const radius = isUser ? t.userBubbleRadius : t.botBubbleRadius;
    return (<View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View style={styles.bubbleGroup}>
        {!isUser && <BotAvatar t={t} avatarIcon={avatarIcon} avatarUrl={avatarUrl}/>}
        <View style={[
            styles.bubble,
            chattyBubbleRadii(radius, isUser),
            { backgroundColor: isUser ? t.userBubbleBg : t.botBubbleBg },
        ]}>
          {message.fileUrl ? <Image source={{ uri: message.fileUrl }} style={styles.attachedImage}/> : null}
          {message.text ? (isUser ? (<Text style={[styles.bubbleTextUser, { color: t.userBubbleText }]}>{message.text}</Text>) : (<SimpleMarkdown text={message.text} style={[styles.bubbleTextAssistant, { color: t.botBubbleText }]}/>)) : null}
        </View>
      </View>
    </View>);
}
function TypingIndicator({ t, avatarIcon, avatarUrl, }) {
    return (<View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={styles.bubbleGroup}>
        <BotAvatar t={t} avatarIcon={avatarIcon} avatarUrl={avatarUrl}/>
        <View style={[styles.bubble, chattyBubbleRadii(t.botBubbleRadius, false), { backgroundColor: t.botBubbleBg }]}>
          <ActivityIndicator size="small" color={t.botBubbleText}/>
        </View>
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
    // px-4 pt-3 pb-2 on web -> 16 horizontal, 12 top, 8 bottom.
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 6,
    },
    headerAvatar: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: "center", justifyContent: "center",
        marginRight: 4,
    },
    headerAvatarImage: { width: 34, height: 34, borderRadius: 17 },
    headerTitle: { fontSize: 14, fontWeight: "600" },
    headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    headerStatus: { fontSize: 9 },
    headerActionButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
    pulsingDot: { width: 6, height: 6, borderRadius: 3 },
    // p-4 space-y-4 on web -> 16 padding, 16 gap between rows.
    messageList: { padding: 16, gap: 16 },
    bubbleRow: { flexDirection: "row" },
    bubbleRowUser: { justifyContent: "flex-end" },
    bubbleRowAssistant: { justifyContent: "flex-start" },
    // max-w-[88%] on web.
    bubbleGroup: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "88%" },
    bubbleAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    bubbleAvatarImage: { width: 24, height: 24, borderRadius: 12 },
    bubble: { paddingHorizontal: 10, paddingVertical: 10 }, // p-2.5 on web
    bubbleTextUser: { color: "#fff", fontSize: 12, lineHeight: 17 },
    bubbleTextAssistant: { color: "#111827", fontSize: 12, lineHeight: 17 },
    attachedImage: { width: 160, height: 120, borderRadius: 10, marginBottom: 6 },
    starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
    starterChip: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: "100%",
    },
    starterText: { fontSize: 12, fontWeight: "500", color: "#374151" },
    banner: { backgroundColor: "#fef3c7", paddingHorizontal: 16, paddingVertical: 8 },
    errorBanner: { backgroundColor: "#fee2e2" },
    bannerText: { fontSize: 11, color: "#374151" },
    composer: {
        margin: 10,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 6,
    },
    emojiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        maxHeight: 160,
        marginBottom: 6,
    },
    emojiCell: {
        width: "12.5%",
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    attachMenu: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 8,
    },
    attachMenuOption: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 14,
        backgroundColor: "#f3f4f6",
        borderRadius: 12,
        gap: 4,
    },
    attachMenuOptionLabel: { fontSize: 11, color: "#4b5563" },
    input: {
        maxHeight: 100,
        fontSize: 12,
        padding: 0,
    },
    composerIconRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    iconButton: {
        width: 28, height: 28,
        alignItems: "center", justifyContent: "center",
    },
    iconButtonText: { fontSize: 16 },
    sendButtonRound: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: "center", justifyContent: "center",
    },
    sendButtonSquare: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: "center", justifyContent: "center",
    },
    sendButtonLabel: {
        height: 32, borderRadius: 16, paddingHorizontal: 14,
        alignItems: "center", justifyContent: "center",
    },
    sendButtonText: { fontSize: 16, fontWeight: "700" },
});
