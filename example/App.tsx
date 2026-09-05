import React, { useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChattyEmbedView, ChattyLauncher } from "@personaliai/react-native";

// Swap this for your own bot id — find it in the Chatty dashboard under
// Embed & Integrate → React Native SDK. This one is the public demo bot.
const DEMO_BOT_ID = "c8fa19c8-dd25-43a3-9c55-e8099e6f532e";

// ChattyEmbedView never requests POST_NOTIFICATIONS itself — this callback fires only when the
// visitor taps "enable notifications" inside the widget (contextual, not upfront at launch),
// and it's this app's job to actually request the permission (see ChattyEmbedView's
// onRequestNotificationPermission doc comment). Mic and location don't need an equivalent
// handler here: react-native-webview's own WebChromeClient already reflects + asks the OS
// dialog itself, contextually, right when the page calls getUserMedia()/geolocation.
const onRequestNotificationPermission = () => {
  if (Platform.OS === "android" && Platform.Version >= 33) {
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
};

export default function App() {
  const [fullScreen, setFullScreen] = useState(false);

  if (fullScreen) {
    return (
      <SafeAreaView style={styles.flex}>
        <ChattyEmbedView
          botId={DEMO_BOT_ID}
          onRequestNotificationPermission={onRequestNotificationPermission}
          onClose={() => setFullScreen(false)}
        />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.content}>
        <Text style={styles.title}>Chatty React Native SDK</Text>
        <Text style={styles.body}>
          This example shows both integration styles: a floating launcher (bottom-right, tap it)
          and a full-screen embedded chat.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => setFullScreen(true)}>
          <Text style={styles.buttonText}>Open full-screen chat</Text>
        </TouchableOpacity>
      </View>
      {/* Floating launcher — its default color follows whatever design is
          selected for this bot in the dashboard; no manual color needed. */}
      <ChattyLauncher
        botId={DEMO_BOT_ID}
        onRequestNotificationPermission={onRequestNotificationPermission}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  body: { fontSize: 15, color: "#4b5563", lineHeight: 21 },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
