# Contributing to @personaliai/react-native

Thanks for considering a contribution — patches, bug reports, and design-parity
fixes against the [web widget](https://github.com/PersonaliAI/chatty) are all
welcome.

## Development setup

```bash
git clone https://github.com/PersonaliAI/chatty-react-native-sdk.git
cd chatty-react-native-sdk
npm install
npm run typecheck
npm run build
```

The `example/` app (Expo) is the fastest way to see a change end to end:

```bash
cd example
npm install
npm start
```

It depends on the SDK via a local `file:` link, so changes in `src/` are
picked up after `npm run build` in the SDK root.

## Project structure

```
src/
  api.ts              HTTP client for /api/widget/*
  session.ts           Persistent session id (AsyncStorage-backed)
  useChattyChat.ts      Conversation state, polling, streaming (headless hook)
  designTokens.ts       The 10 widget designs' colors/radii
  ChattyChatView.tsx     Full chat screen (React Native components, no WebView)
  ChattyLauncher.tsx     Floating button + full-screen modal
example/                 Expo app consuming the SDK
```

## Keeping design parity with the web widget

`designTokens.ts` is a hand-ported mirror of
[`globals.css`](https://github.com/PersonaliAI/chatty/blob/main/frontend/src/app/globals.css)'s
`.style-*` rules. If a design's colors change on web, the same values need
updating here — there's no shared source of truth across languages (yet).
Cross-check against the web repo before opening a PR that touches these
values.

## Testing

```bash
npm run typecheck
npm run build
```

There's no compiled-and-verified test suite in this repo yet — changes are
currently reviewed by hand and against `example/`. If you're adding a
non-trivial change, a Jest test covering it is very welcome.

## Pull requests

- Keep PRs scoped to one change — a design fix and a new feature should be
  two PRs, not one.
- Explain *why*, not just *what*, in the description — especially for
  anything touching design tokens or the API client's request shape.
- CI (see `.github/workflows/ci.yml`) must pass before merge.

## Reporting bugs

Open an issue with: the SDK version, RN version, platform (iOS/Android), a
minimal repro (ideally as a diff against `example/`), and what you expected
vs. what happened.
