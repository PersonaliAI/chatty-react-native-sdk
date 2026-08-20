import React, { useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChattyChatView, ChattyLauncher } from "@personaliai/react-native";

// Swap this for your own bot id — find it in the Chatty dashboard under
// Embed & Integrate → React Native SDK. This one is the public demo bot.
const DEMO_BOT_ID = "c8fa19c8-dd25-43a3-9c55-e8099e6f532e";

// The SDK's voice-call/notification-bell buttons only fire a callback — it doesn't bundle a
// call implementation or push registration itself (see ChattyChatView's doc comments). These
// alerts just prove the buttons are wired up; a real app would launch its own LiveKit call
// screen / notification opt-in flow here instead.
const onVoiceCallPress = () => Alert.alert("Voice call tapped", "Wire up your own call UI here");
const onNotificationBellPress = () =>
  Alert.alert("Notification permission resolved", "Register for push here");

export default function App() {
  const [fullScreen, setFullScreen] = useState(false);

  if (fullScreen) {
    return (
      <SafeAreaView style={styles.flex}>
        <ChattyChatView
          botId={DEMO_BOT_ID}
          onVoiceCallPress={onVoiceCallPress}
          onNotificationBellPress={onNotificationBellPress}
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
        onVoiceCallPress={onVoiceCallPress}
        onNotificationBellPress={onNotificationBellPress}
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
