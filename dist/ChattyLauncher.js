import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, Image, StyleSheet, Modal, SafeAreaView, View, Platform } from "react-native";
import { avatarGlyph } from "./ChattyChatView";
import { ChattyEmbedView } from "./ChattyEmbedView";
import { ChattyClient } from "./api";
import { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle, chattyLauncherRadii } from "./designTokens";
const FALLBACK_DESIGN = "minimal";
/**
 * Floating launcher button + full-screen modal chat panel (the actual web
 * widget page, loaded via ChattyEmbedView — see that file for why). 60x60
 * (widget.js's actual size), color/shadow follow the selected design's own
 * LAUNCHER_STYLES entry — NOT always the same as the user-bubble color (e.g.
 * dark-sleek's launcher is dark, not its teal accent; neubrutalism's is
 * black, not pink).
 */
export function ChattyLauncher(props) {
    const { position = "right", ...chatProps } = props;
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [designId, setDesignId] = useState(FALLBACK_DESIGN);
    const [rawWidgetStyle, setRawWidgetStyle] = useState(undefined);
    const [avatarIcon, setAvatarIcon] = useState(undefined);
    const [avatarUrl, setAvatarUrl] = useState(undefined);
    const [launcherColorScheme, setLauncherColorScheme] = useState(undefined);
    useEffect(() => {
        let cancelled = false;
        // Note: props.baseUrl here means the embed *page's* host (for
        // ChattyEmbedView below) — this fetch is only for launcher-button
        // styling and always hits the default widget API host regardless.
        new ChattyClient({ botId: props.botId })
            .getTheme()
            .then((t) => {
            if (cancelled)
                return;
            setDesignId(chattyNormalizeWidgetStyle(t.widget_style));
            setRawWidgetStyle(t.widget_style);
            setAvatarIcon(t.avatar_icon);
            setAvatarUrl(t.avatar_url);
            setLauncherColorScheme(t.color_scheme?.launcher);
        })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.botId]);
    const baseTokens = CHATTY_DESIGN_TOKENS[designId] ?? CHATTY_DESIGN_TOKENS[FALLBACK_DESIGN];
    // Dashboard's color_scheme.launcher override, same as standalone.tsx's own
    // launcherBg/launcherIconOverride handling.
    const tokens = {
        ...baseTokens,
        launcherBg: launcherColorScheme?.bg ?? baseTokens.launcherBg,
    };
    const launcherIconColor = launcherColorScheme?.text;
    const launcherRadii = chattyLauncherRadii(rawWidgetStyle, 60, position);
    return (<>
      <TouchableOpacity style={[
            styles.button,
            launcherRadii,
            {
                [position]: 20,
                backgroundColor: tokens.launcherBg,
                shadowColor: tokens.launcherShadow,
            },
        ]} onPress={() => {
            setOpen(true);
            setUnread(0);
        }} activeOpacity={0.85}>
        {avatarIcon === "custom" && avatarUrl ? (<Image source={{ uri: avatarUrl }} style={styles.buttonIconImage}/>) : (<Text style={[styles.buttonIcon, launcherIconColor ? { color: launcherIconColor } : null]}>
            {avatarGlyph(avatarIcon)}
          </Text>)}
        {unread > 0 && (<View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>)}
      </TouchableOpacity>

      {/* Close is driven by the page's own header close button, via the
            chatty:close bridge message — no separate close bar drawn here. */}
      <Modal visible={open} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}>
        <SafeAreaView style={styles.modalSafeArea}>
          <ChattyEmbedView {...chatProps} onMessage={() => {
            if (!open)
                setUnread((u) => u + 1);
            chatProps.onMessage?.();
        }} onClose={() => setOpen(false)}/>
        </SafeAreaView>
      </Modal>
    </>);
}
const styles = StyleSheet.create({
    button: {
        position: "absolute",
        bottom: 20,
        // widget.js's launcher is 60x60px.
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 999,
    },
    buttonIcon: { fontSize: 24 },
    buttonIconImage: { width: 36, height: 36, borderRadius: 18 },
    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
    },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    modalSafeArea: { flex: 1, backgroundColor: "#fff" },
});
