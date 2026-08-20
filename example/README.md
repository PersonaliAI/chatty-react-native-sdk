# Chatty React Native SDK — Example

A minimal Expo app demonstrating both integration styles from
[`@personaliai/react-native`](..): a floating launcher and an embedded
full-screen chat.

## Run it

```bash
cd ..
npm install
npm run build   # builds dist/ so the local file: dependency below has something to import

cd example
npm install
npm start
```

Then press `i` for iOS Simulator, `a` for Android emulator, or `w` for web.

The example depends on the SDK via `"@personaliai/react-native": "file:.."`, so after changing
anything in `../src`, re-run `npm run build` in the repo root and reload the Expo app.
