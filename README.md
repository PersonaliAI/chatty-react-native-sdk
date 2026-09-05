<div align="center">

# Chatty React Native SDK

**Native React Native chat UI for [Chatty](https://github.com/PersonaliAI/chatty) — zero WebView, zero compromise.**

Drop a fully native, on-brand support chat into any React Native or Expo app in minutes. Talks
directly to the same `/api/widget/*` backend as the Chatty web widget, and renders every bubble,
avatar, and composer with real `View`/`Text`/`FlatList` components — no `WebView`, no JS bridge.

[![CI](https://github.com/PersonaliAI/chatty-react-native-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/PersonaliAI/chatty-react-native-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@personaliai/react-native.svg)](https://www.npmjs.com/package/@personaliai/react-native)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Expo compatible](https://img.shields.io/badge/Expo-compatible-000020.svg?logo=expo&logoColor=white)](#requirements)
[![Stars](https://img.shields.io/github/stars/PersonaliAI/chatty-react-native-sdk?style=social)](https://github.com/PersonaliAI/chatty-react-native-sdk/stargazers)

[Install](#install) · [Quick start](#quick-start) · [Design gallery](#design-gallery) · [API reference](#api-reference) · [Example app](#example-app)

</div>

---

## Why this SDK

| | |
|---|---|
| **No WebView, anywhere** | Every bubble, avatar, and the composer are real RN components — no iframe, no JS bridge, no WebView memory/perf overhead. |
| **Matches your dashboard automatically** | Fetches the bot's theme and renders with the exact colors, corner radii, and launcher shape chosen in the dashboard — no manual styling. |
| **Three integration shapes** | A floating [`ChattyLauncher`](#chattylauncher), an embedded [`ChattyChatView`](#chattychatview), or the headless [`useChattyChat`](#usechattychat-headless) hook. |
| **A real composer, not a stub** | Full-Unicode emoji picker (search + categories, ~1,850 emoji) and an animated attach menu (camera, photo, documents, location), built in — each wires up to whatever picker/recorder/location API your app already uses. |
| **Works with bare RN and Expo** | No native linking required beyond `@react-native-async-storage/async-storage`, which most apps already have. |

## Install

```bash
npm install @personaliai/react-native @react-native-async-storage/async-storage
```

`react` and `react-native` are peer dependencies — install versions matching your app (`react`
18+, `react-native` 0.72+). Voice calls (`ChattyVoiceCallView`) are the one feature that needs
native linking — see [Voice-call button](#chattychatview) — everything else needs nothing beyond
`@react-native-async-storage/async-storage`.

## Quick start

Find your bot ID in the Chatty dashboard under **Embed & Integrate → React Native SDK**.

**Floating launcher** *(recommended)* — a bubble that expands into a full-screen modal, the
native equivalent of the web widget's launcher button:

```tsx
import { ChattyLauncher } from "@personaliai/react-native";

export default function App() {
  return (
    <>
      {/* ...your app... */}
      <ChattyLauncher botId="YOUR_BOT_ID" position="right" />
    </>
  );
}
```

**Script Method (WebView Embed — 100% web widget parity)** — loads the exact production widget served at `/embed/{botId}` with pixel-for-pixel visual and feature parity, including client-side voice messages, file attachments, AI search, and CSAT:

```tsx
import { ChattyEmbedView } from "@personaliai/react-native";

function SupportScreen() {
  return (
    <ChattyEmbedView
      botId="YOUR_BOT_ID"
      onReady={() => console.log("Chat ready")}
      onMessage={() => console.log("New message")}
      onClose={() => navigation.goBack()}
      onRequestNotificationPermission={(botName) => {
        // Request POST_NOTIFICATIONS contextually (Android 13+ / iOS)
      }}
      onMicPermissionNeeded={() => {
        // Request RECORD_AUDIO permission contextually when user taps the mic
      }}
      onLocationPermissionNeeded={() => {
        // Request location permission contextually when user selects "Location"
      }}
    />
  );
}
```

**Native Components Chat** — renders with 100% native React Native components (`FlatList`, `View`, `Text`, `ChattyMarkdown`):

```tsx
import { ChattyChatView } from "@personaliai/react-native";

function SupportScreen() {
  return <ChattyChatView botId="YOUR_BOT_ID" />;
}
```

<details>
<summary><strong>Headless</strong> — build your own UI</summary>

<br>

```tsx
import { useChattyChat } from "@personaliai/react-native";

function CustomChat() {
  const { messages, sendText, sending, theme } = useChattyChat({ botId: "YOUR_BOT_ID" });
  // render messages and call sendText(text) yourself
}
```

</details>

## Design gallery

The SDK ships all 10 Chatty widget designs as color/radius tokens, ported 1:1 from the web
widget's `globals.css`, so a native screen looks like whatever design is chosen in the dashboard
rather than one generic look. No configuration required — `ChattyChatView` and `ChattyLauncher`
fetch the bot's theme and resolve the matching token set automatically, including legacy
`widget_style` IDs from older presets.

| Design | Accent |
|---|---|
| `minimal` | ![#1c1a15](https://img.shields.io/badge/%20-1c1a15?style=flat-square&color=1c1a15) |
| `playful` | ![#ff8a5c](https://img.shields.io/badge/%20-ff8a5c?style=flat-square&color=ff8a5c) |
| `corporate` | ![#1c2e4a](https://img.shields.io/badge/%20-1c2e4a?style=flat-square&color=1c2e4a) |
| `dark-sleek` | ![#00e5c7](https://img.shields.io/badge/%20-00e5c7?style=flat-square&color=00e5c7) |
| `gradient-glow` | ![#a855f7](https://img.shields.io/badge/%20-a855f7?style=flat-square&color=a855f7) |
| `glassmorphism` | ![#8f6ff0](https://img.shields.io/badge/%20-8f6ff0?style=flat-square&color=8f6ff0) |
| `ecommerce` | ![#0f9d8c](https://img.shields.io/badge/%20-0f9d8c?style=flat-square&color=0f9d8c) |
| `healthcare-calm` | ![#6f9c7d](https://img.shields.io/badge/%20-6f9c7d?style=flat-square&color=6f9c7d) |
| `neubrutalism` | ![#ff3d67](https://img.shields.io/badge/%20-ff3d67?style=flat-square&color=ff3d67) |
| `luxury-editorial` | ![#161412](https://img.shields.io/badge/%20-161412?style=flat-square&color=161412) |

Font pairing (each web design uses a distinct Google Font) is intentionally out of scope for
this release; color, radius, and header/bubble treatment carry most of a design's identity.

## API reference

### `ChattyLauncher`

```tsx
<ChattyLauncher
  botId={string}
  baseUrl={string}          // optional, defaults to the production API
  host={string}             // optional, see Notes
  position={"left" | "right"}  // optional, defaults to "right"
  onReady={() => void}
  onMessage={(message) => void}
  onVoiceCallPress={() => void}
  onNotificationBellPress={() => void}
  enableNotificationBell={boolean}  // optional, defaults to true — see Permissions
/>
```

The button color follows the active design's accent automatically — same as web.

### `ChattyChatView`

```tsx
<ChattyChatView
  botId={string}
  baseUrl={string}          // optional, defaults to the production API
  host={string}             // optional, see Notes
  onReady={() => void}
  onMessage={(message) => void}
  onCameraPress={() => void}          // optional, "Camera" tapped in the attach menu
  onPhotoLibraryPress={() => void}    // optional, "Photo Library" tapped in the attach menu
  onDocumentPress={() => void}        // optional, "Documents" tapped in the attach menu
  onShareLocationPress={() => void}   // optional, "Location" tapped in the attach menu
  onAttachPress={() => void}          // optional fallback if the four above aren't given
  onMicPress={() => void}             // optional — mic button only renders when this is set
  onVoiceCallPress={() => void}       // optional, header voice-call button (only shown when
                                       // the bot's dashboard has voice enabled)
  onNotificationBellPress={() => void}  // optional, header notification-bell button — see Notes
  onClose={() => void}                // optional, renders a header close (✕) button.
                                       // ChattyLauncher passes this for you.
  enableNotificationBell={boolean}    // optional, defaults to true — see Permissions
/>
```

### `ChattyEmbedView` (Script Method)

The official web widget hosted in a React Native `WebView`. Guaranteed pixel-for-pixel and feature-for-feature parity with the web widget, with automatic permission reflection, alert suppression, and OEM font scale isolation:

```tsx
<ChattyEmbedView
  botId={string}
  baseUrl={string}                    // optional, defaults to https://chatty.personaliai.com
  onReady={() => void}                // optional, fired when web widget finishes loading
  onMessage={() => void}              // optional, fired on every assistant reply
  onClose={() => void}                // optional, fired when user closes the widget / CSAT
  onRequestNotificationPermission={(botName) => void}  // optional, fired on notification bell tap
  onMicPermissionNeeded={() => void}  // optional, fired on mic tap if RECORD_AUDIO not granted
  onLocationPermissionNeeded={() => void} // optional, fired on location attach if not granted
/>
```

### `ChattyMarkdown`

Real CommonMark + GFM (tables, strikethrough, blockquotes, code blocks with copy) + LaTeX equation support (`$inline$` and `$$block$$`), matching web widget's feature set. Used automatically by `ChattyChatView` and available standalone:

```tsx
import { ChattyMarkdown } from "@personaliai/react-native";

<ChattyMarkdown
  text="Solve $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ for $x$."
  color="#111827"
  fontSize={13}
/>
```

> [!NOTE]
> This SDK renders the composer's emoji picker and attach/mic UI (with layout animation), but it
> deliberately doesn't bundle a camera, photo-library, document-picker, geolocation, or
> audio-recording dependency itself — that would mean forcing every consumer (bare RN and Expo
> alike) to install and link a native module they might not want. Instead, `onCameraPress` /
> `onPhotoLibraryPress` / `onDocumentPress` / `onShareLocationPress` / `onMicPress` fire when
> their button is tapped so you can wire up whichever picker/recorder/location API your app
> already uses (`expo-image-picker` + `expo-av` + `expo-document-picker` + `expo-location`,
> `react-native-image-picker`, etc.) and then call `sendImage` yourself — for location, matching
> the web widget's behavior means setting the composer text to a Google Maps link rather than
> sending a special message type. The header's clear-chat button (↺) is fully built in and needs
> no wiring — it resets local messages and starts a fresh session.

### `useChattyChat` (headless)

```tsx
const {
  theme, ready, messages, sending, aiPaused, error,
  sendText, sendImage, clearChat,
} = useChattyChat({ botId: string, baseUrl?: string, host?: string });
```

Everything `ChattyChatView` uses internally — conversation state, polling, and the
send/sendImage/clearChat actions — with no UI attached, for apps that want to render their own
layout.

### Notes

<details open>
<summary><strong id="permissions">Permissions — what this SDK requests, and how to opt out</strong></summary>

<br>

This SDK strictly adheres to the **"Reflect, Never Request"** contract:

| Feature | Android Permission | iOS Info.plist Key | Callback |
|---|---|---|---|
| **Voice Notes (`getUserMedia`)** | `android.permission.RECORD_AUDIO`<br>`android.permission.MODIFY_AUDIO_SETTINGS` | `NSMicrophoneUsageDescription` | `onMicPermissionNeeded` |
| **Location Share (`geolocation`)** | `android.permission.ACCESS_COARSE_LOCATION`<br>`android.permission.ACCESS_FINE_LOCATION` | `NSLocationWhenInUseUsageDescription` | `onLocationPermissionNeeded` |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` | N/A (UserNotifications API) | `onRequestNotificationPermission` |

In `ChattyEmbedView`, the SDK checks permissions read-only and reflects the status to the web widget. If a user taps the mic or location attach without permissions, `onMicPermissionNeeded` or `onLocationPermissionNeeded` fires so you can present your own rationale and request the permission. Once granted, returning to the view or subsequent taps immediately succeed.

#### Android Setup (`android/app/src/main/AndroidManifest.xml`)
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

#### iOS Setup (`ios/Podfile` / `Info.plist`)
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to record voice messages for support.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to share with support.</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to attach photos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to attach photos.</string>
```

</details>

<details open>
<summary><strong>Security — <code>bot_id</code> and domain restriction</strong></summary>

<br>

`bot_id` is not a secret — it's extractable from any client, web or mobile. Domain restriction
(`allowed_domains` in the dashboard) is enforced by the backend as a **rate-limit tier**, not a
hard reject: verified web traffic gets 30 msgs/60s per bot+IP, everything else (including all
mobile SDK traffic — there's no way for a native app to obtain a "verified" token the way a
browser's `Referer` allows) gets throttled to 5 msgs/120s. The `host` prop this SDK sends is
advisory only and isn't used for access control. If your bot is mobile-primary, leave
`allowed_domains` empty to get the normal 30/60s tier instead.

</details>

<details>
<summary><strong>Notification bell — what it does and doesn't do</strong></summary>

<br>

Tapping it requests `POST_NOTIFICATIONS` on Android 13+ (`PermissionsAndroid`, built into RN
core — no extra dependency) and then calls `onNotificationBellPress`. There's no cross-platform
JS API for the permission ask on iOS — request it yourself (e.g. via `expo-notifications`)
before/inside the callback. Either way, that's as far as this SDK goes: actually *delivering* a
push when a reply arrives while the app is backgrounded needs FCM/APNs wired up at the app level
(register the device token, send it to your backend, store it against the session/user, call
FCM/APNs when a message lands for a session that isn't actively polling) — none of that exists
yet, it's backend work in `chatty-backend`.

</details>

<details>
<summary><strong>Voice-call button</strong></summary>

<br>

Only shown when the bot's dashboard has voice enabled, and fires `onVoiceCallPress`. This SDK now
ships a ready-to-render call screen, `ChattyVoiceCallView` — render it yourself from that callback
(it's opt-in, not wired in automatically, so apps that never use voice don't pay for the
dependency):

```tsx
import { ChattyChatView, ChattyVoiceCallView, ChattyClient } from "@personaliai/react-native";
import { registerGlobals } from "@livekit/react-native"; // once, at app startup (e.g. index.js)

registerGlobals();

function MyChat() {
  const [showCall, setShowCall] = useState(false);
  const client = useMemo(() => new ChattyClient({ botId: "YOUR_BOT_ID" }), []);

  if (showCall) {
    return (
      <ChattyVoiceCallView
        client={client}
        sessionId={sessionId} // the same session id ChattyChatView/useChattyChat is using
        widgetStyle={theme?.widget_style}
        onClose={() => setShowCall(false)}
      />
    );
  }
  return <ChattyChatView botId="YOUR_BOT_ID" onVoiceCallPress={() => setShowCall(true)} />;
}
```

Needs three additional peer dependencies only if you use this (`npm i @livekit/react-native
livekit-client @livekit/react-native-webrtc` + the usual iOS `pod install` / Android autolinking) —
apps that don't render `ChattyVoiceCallView` don't need them. See LiveKit's own React Native setup
docs for platform permissions (`NSMicrophoneUsageDescription` on iOS, `RECORD_AUDIO` on Android).

</details>

- Lead capture and meeting booking happen conversationally (the assistant decides to ask/act) —
  there's no separate REST call to trigger them from the SDK.
- Polling for human-agent takeover messages runs every 4s while the chat is mounted, matching
  the web widget's behavior.
- Conversation history is persisted locally (`AsyncStorage`), mirroring the web widget's
  `localStorage` cache, so a returning user sees their prior messages.

## Example app

[`example/`](example) is a minimal, runnable Expo app demonstrating all integration styles side
by side.

```bash
npm install && npm run build   # build the SDK once
cd example
npm install
npm start
```

Then press `i` / `a` / `w` to try it on iOS Simulator, Android emulator, or web.

## Requirements

- React 18+, React Native 0.72+ (Expo SDK 49+)
- `@react-native-async-storage/async-storage` 1.19+

---

<div align="center">

**[Contributing](CONTRIBUTING.md)** — bug reports, design-parity fixes, and PRs are welcome.

Licensed under [MIT](LICENSE) © PersonaliAI

</div>
