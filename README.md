# Chatty React Native SDK

**Native React Native chat UI for [Chatty](https://github.com/PersonaliAI/chatty) — no WebView.**

Drop a fully native, on-brand support chat into any React Native or Expo app. The SDK talks
directly to the same `/api/widget/*` backend as the Chatty web widget and renders every message,
bubble, and composer with real `View`/`Text`/`FlatList` components — no `WebView`, no JS bridge
overhead.

[![CI](https://github.com/PersonaliAI/chatty-react-native-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/PersonaliAI/chatty-react-native-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@personaliai/react-native.svg)](https://www.npmjs.com/package/@personaliai/react-native)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Expo compatible](https://img.shields.io/badge/Expo-compatible-000020.svg)](#requirements)

---

## Contents

- [Why this SDK](#why-this-sdk)
- [Install](#install)
- [Quick start](#quick-start)
- [Design parity](#design-parity)
- [API reference](#api-reference)
- [Example app](#example-app)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Why this SDK

- **No WebView.** Every bubble, avatar, and the composer are real RN components — no iframe, no
  JS bridge, no WebView memory/perf overhead.
- **Matches your dashboard design automatically.** Whatever one of the 10 Chatty widget designs
  is selected for the bot, the SDK fetches the theme and renders with matching colors and corner
  radii — no manual styling needed. See [Design parity](#design-parity).
- **Three integration shapes.** A floating [`ChattyLauncher`](#chattylauncher), an embedded
  [`ChattyChatView`](#chattychatview), or the headless [`useChattyChat`](#usechattychat-headless)
  hook if you want to build your own UI entirely.
- **Works with bare RN and Expo.** No native linking required beyond
  `@react-native-async-storage/async-storage`, which most apps already have.

## Install

```bash
npm install @personaliai/react-native @react-native-async-storage/async-storage
```

`react` and `react-native` are peer dependencies — install versions matching your app (`react`
18+, `react-native` 0.72+).

## Quick start

Find your bot ID in the Chatty dashboard under **Embed & Integrate → React Native SDK**.

### Floating launcher (recommended)

A bubble that expands into a full-screen modal — the native equivalent of the web widget's
launcher button.

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

### Embedded full-screen chat

Place the chat directly in your own navigation — e.g. as a "Support" screen.

```tsx
import { ChattyChatView } from "@personaliai/react-native";

function SupportScreen() {
  return <ChattyChatView botId="YOUR_BOT_ID" />;
}
```

### Headless (build your own UI)

```tsx
import { useChattyChat } from "@personaliai/react-native";

function CustomChat() {
  const { messages, sendText, sending, theme } = useChattyChat({ botId: "YOUR_BOT_ID" });
  // render messages and call sendText(text) yourself
}
```

## Design parity

The SDK ships all 10 Chatty widget designs as color/radius tokens, ported 1:1 from the web
widget's `globals.css`, so a native screen looks like the design chosen in the dashboard rather
than one generic look:

`minimal` · `playful` · `corporate` · `dark-sleek` · `gradient-glow` · `glassmorphism` ·
`ecommerce` · `healthcare-calm` · `neubrutalism` · `luxury-editorial`

No configuration is required — `ChattyChatView` and `ChattyLauncher` fetch the bot's theme and
resolve the matching token set automatically, including legacy `widget_style` IDs from older
presets. Font pairing (each web design uses a distinct Google Font) is intentionally out of
scope for this release; color, radius, and header/bubble treatment carry most of a design's
identity.

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
  onAttachPress={() => void}  // optional, called instead of the built-in image picker
/>
```

### `useChattyChat` (headless)

```tsx
const {
  theme, ready, messages, sending, aiPaused, error,
  sendText, sendImage,
} = useChattyChat({ botId: string, baseUrl?: string, host?: string });
```

Everything `ChattyChatView` uses internally — conversation state, polling, and the
send/sendImage actions — with no UI attached, for apps that want to render their own layout.

### Notes

- If the bot has `allowed_domains` configured in the dashboard, pass a matching `host` prop —
  native apps don't send an `Origin`/`Referer` header, so without it requests are rejected with
  `403`. Leave `allowed_domains` empty for mobile-only bots to skip this entirely.
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

## Contributing

Bug reports, design-parity fixes, and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md)
for local setup and project structure.

## License

[MIT](LICENSE) © PersonaliAI
