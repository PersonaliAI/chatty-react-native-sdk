import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
  PermissionsAndroid,
} from "react-native";
import WebView from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
// Not re-exported from the package root (only FileDownload/WebViewMessageEvent/
// WebViewNavigation are) — this is the same deep path react-native-webview's
// own docs point to for the rest of its event types.
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import NetInfo from "@react-native-community/netinfo";

import { ChattyClient, ChattyTheme } from "./api";
import { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle } from "./designTokens";

export const chattyDefaultEmbedBaseUrl = "https://chatty.personaliai.com";

/**
 * The exact bridge protocol EmbedClient.tsx speaks to its `window.parent`
 * (verified by reading that file, not guessed) — this component is the
 * "parent" now, standing in for the browser tab that would normally host
 * the iframe. Outbound (page -> us): chatty:ready, chatty:message,
 * chatty:close, chatty-request-notification, chatty-trigger-notification.
 * Inbound (us -> page): chatty-notification-status, chatty-fullscreen.
 */
type OutboundBridgeMessage =
  | { type: "chatty:ready" }
  | { type: "chatty:message"; role: string }
  | { type: "chatty:close" }
  | { type: "chatty-request-notification"; botName?: string }
  | { type: "chatty-trigger-notification"; botName?: string; body?: string }
  | { type: "chatty:mic-requested" }
  | { type: "chatty:location-requested" };

// Injected before the page's own scripts run. EmbedClient.tsx only sends/accepts
// bridge messages when `window.parent !== window` (it thinks it's iframed) and
// filters inbound messages with `e.source !== window.parent` — a plain
// `window.ReactNativeWebView.postMessage` bridge satisfies neither check, since
// there's no real parent frame in a WebView. This shim gives the page a stable
// fake `window.parent` object so both checks pass in both directions.
export const BRIDGE_SHIM_JS = `
(function() {
  if (window.__chattyBridgeInstalled) { return true; }
  window.__chattyBridgeInstalled = true;
  // MessageEvent's constructor only accepts a Window or MessagePort for
  // 'source' (not a generic EventTarget, and definitely not a plain object
  // literal) — a MessagePort from a throwaway MessageChannel is the only
  // one of those we can actually construct standalone. Its native
  // postMessage is shadowed with our own override (own-property lookup
  // beats the prototype's), so the port itself is never really used to
  // send anything, only to satisfy the type check and as a stable
  // identity for the page's own 'e.source !== window.parent' filter.
  var fakeParent = new MessageChannel().port1;
  fakeParent.postMessage = function(data) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch (e) {}
  };
  try {
    Object.defineProperty(window, 'parent', { get: function() { return fakeParent; }, configurable: true });
  } catch (e) {}
  window.__chattyDeliver = function(json) {
    try {
      var data = JSON.parse(json);
      window.dispatchEvent(new MessageEvent('message', { data: data, source: fakeParent }));
    } catch (e) {}
  };
  // Suppress raw browser window.alert() calls (e.g. "Browser push notifications
  // are not supported on this browser" from EmbedClient.tsx) which would otherwise
  // render as a jarring browser dialog.
  try {
    window.alert = function(msg) {
      try { console.log('[ChattyBridge] alert suppressed: ' + msg); } catch (e) {}
    };
  } catch (e) {}
  // Intercept getUserMedia so native host knows mic access was requested.
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      var _origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function(constraints) {
        try { fakeParent.postMessage({ type: 'chatty:mic-requested' }); } catch (e) {}
        return _origGUM(constraints);
      };
    }
  } catch (e) {}
  // Intercept geolocation so native host knows location access was requested.
  try {
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      var _origGCP = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        try { fakeParent.postMessage({ type: 'chatty:location-requested' }); } catch (e) {}
        return _origGCP(success, error, options);
      };
    }
  } catch (e) {}
  true;
})();
`;

export interface ChattyEmbedViewProps {
  botId: string;
  /** Overrides the embed page's own host (defaults to the production site). */
  baseUrl?: string;
  /** Called once the embed page has finished loading and is interactive (chatty:ready). */
  onReady?: () => void;
  /** Called on every new assistant/agent reply (chatty:message) — e.g. to bump an unread badge. */
  onMessage?: () => void;
  /** Called when the page asks to be closed (X button, or after CSAT). Only meaningful when
   * this view is presented inside your own dismissible container (modal, sheet, screen). */
  onClose?: () => void;
  /** Called when the visitor taps the in-chat "enable notifications" control. This SDK never
   * requests POST_NOTIFICATIONS itself — see ChattyChatView's onNotificationBellPress doc for
   * the same "reflect, never request" contract. Request the permission yourself here; the
   * granted state is then reflected back into the page automatically (checked read-only via
   * PermissionsAndroid.check, re-checked on app foreground). */
  onRequestNotificationPermission?: (botName: string | undefined) => void;
  /** Called when the visitor taps the composer's mic button (getUserMedia) and RECORD_AUDIO
   * is not yet granted. Request the permission contextually in your app; subsequent taps will
   * succeed once granted. Follows the same "reflect, never request" contract. */
  onMicPermissionNeeded?: () => void;
  /** Called when the visitor taps the attach menu's "Location" option and location permission
   * is not yet granted. Follows the same "reflect, never request" contract. */
  onLocationPermissionNeeded?: () => void;
}

function OfflineView({ onRetry, bg, fg }: { onRetry: () => void; bg: string; fg: string }) {
  return (
    <View style={[styles.center, { backgroundColor: bg }]}>
      <Text style={[styles.offlineTitle, { color: fg }]}>You're offline</Text>
      <Text style={[styles.offlineBody, { color: fg }]}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Loads the bot's own web widget page (the exact code chatty.personaliai.com
 * serves at /embed/[botId]) inside a WebView — guaranteed pixel-for-pixel and
 * feature-for-feature parity with the web widget, since it IS the web widget,
 * not a native reimplementation of it. Trades native scroll/animation feel
 * for zero parity drift; see ChattyChatView for the native-components version.
 */
export function ChattyEmbedView(props: ChattyEmbedViewProps) {
  const {
    botId,
    baseUrl = chattyDefaultEmbedBaseUrl,
    onReady,
    onMessage,
    onClose,
    onRequestNotificationPermission,
    onMicPermissionNeeded,
    onLocationPermissionNeeded,
  } = props;
  const embedUrl = useMemo(() => `${baseUrl.replace(/\/$/, "")}/embed/${botId}`, [baseUrl, botId]);
  const embedOrigin = useMemo(() => new URL(embedUrl).origin, [embedUrl]);

  const webviewRef = useRef<WebView>(null);
  const [pageReady, setPageReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [notifGranted, setNotifGranted] = useState(
    !(Platform.OS === "android" && Platform.Version >= 33),
  );
  const [theme, setTheme] = useState<ChattyTheme | null>(null);

  // Only used for the loading/offline/error screens' background so there's no
  // white flash before the page paints — the page itself owns all real theming.
  useEffect(() => {
    let cancelled = false;
    new ChattyClient({ botId })
      .getTheme()
      .then((t) => { if (!cancelled) setTheme(t); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [botId]);
  const t = CHATTY_DESIGN_TOKENS[chattyNormalizeWidgetStyle(theme?.widget_style)];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  const checkNotifPermission = useCallback(() => {
    if (!(Platform.OS === "android" && Platform.Version >= 33)) return;
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
      .then(setNotifGranted)
      .catch(() => {});
  }, []);
  useEffect(() => {
    checkNotifPermission();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkNotifPermission();
    });
    return () => sub.remove();
  }, [checkNotifPermission]);

  const deliver = useCallback((data: Record<string, unknown>) => {
    const json = JSON.stringify(JSON.stringify(data));
    webviewRefInject(webviewRef, `window.__chattyDeliver && window.__chattyDeliver(${json}); true;`);
  }, []);

  // Reflect the current (never requested by us) permission state into the page
  // whenever it changes, matching web's own postMessage-driven status updates.
  useEffect(() => {
    if (pageReady) deliver({ type: "chatty-notification-status", granted: notifGranted });
  }, [pageReady, notifGranted, deliver]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let msg: OutboundBridgeMessage | null = null;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!msg) return;
      switch (msg.type) {
        case "chatty:ready":
          setPageReady(true);
          onReady?.();
          break;
        case "chatty:message":
          onMessage?.();
          break;
        case "chatty:close":
          onClose?.();
          break;
        case "chatty-request-notification":
          onRequestNotificationPermission?.(msg.botName);
          break;
        case "chatty-trigger-notification":
          // This SDK doesn't bundle a local-notification dependency (matches
          // ChattyChatView's own scope) — a host app that wants a system
          // notification while backgrounded should watch onMessage instead
          // and post it with its own notifee/expo-notifications setup.
          break;
        case "chatty:mic-requested":
          if (Platform.OS === "android") {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
              .then((granted) => {
                if (!granted) onMicPermissionNeeded?.();
              })
              .catch(() => {
                onMicPermissionNeeded?.();
              });
          } else {
            onMicPermissionNeeded?.();
          }
          break;
        case "chatty:location-requested":
          if (Platform.OS === "android") {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
              .then((fineGranted) => {
                if (fineGranted) return true;
                return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
              })
              .then((granted) => {
                if (!granted) onLocationPermissionNeeded?.();
              })
              .catch(() => {
                onLocationPermissionNeeded?.();
              });
          } else {
            onLocationPermissionNeeded?.();
          }
          break;
      }
    },
    [onReady, onMessage, onClose, onRequestNotificationPermission, onMicPermissionNeeded, onLocationPermissionNeeded],
  );

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      try {
        const url = new URL(request.url);
        if (url.origin === embedOrigin) return true;
        if (["mailto:", "tel:", "sms:"].includes(url.protocol)) {
          Linking.openURL(request.url).catch(() => {});
          return false;
        }
        if (url.protocol === "http:" || url.protocol === "https:") {
          Linking.openURL(request.url).catch(() => {});
          return false;
        }
        return true;
      } catch {
        return true;
      }
    },
    [embedOrigin],
  );

  const retry = useCallback(() => {
    setLoadError(false);
    setPageReady(false);
    setReloadKey((k) => k + 1);
  }, []);

  if (!isOnline) {
    return <OfflineView onRetry={retry} bg={t.containerBg} fg={t.headerText} />;
  }
  if (loadError) {
    return (
      <View style={[styles.center, { backgroundColor: t.containerBg }]}>
        <Text style={[styles.offlineTitle, { color: t.headerText }]}>Couldn't load chat</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: t.containerBg }]}>
      {/* react-native-webview's root type declarations default WebView's props
          generic to `undefined`, and `WebViewProps & undefined` collapses to
          `never` — explicitly parameterizing with `{}` sidesteps that. */}
      <WebView<{}>
        key={reloadKey}
        ref={webviewRef}
        source={{ uri: embedUrl }}
        style={styles.flex}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        injectedJavaScriptBeforeContentLoaded={BRIDGE_SHIM_JS}
        onError={() => setLoadError(true)}
        onHttpError={() => setLoadError(true)}
        allowsBackForwardNavigationGestures={false}
        setSupportMultipleWindows={false}
        geolocationEnabled
        allowFileAccess
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        textZoom={100}
        overScrollMode="never"
        bounces={false}
      />
      {!pageReady ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.containerBg }]}>
          <ActivityIndicator color={t.userBubbleBg} />
        </View>
      ) : null}
    </View>
  );
}

// react-native-webview's `injectJavaScript` is an imperative ref method, not a
// prop — wrapped here so `deliver` can stay a stable useCallback without
// re-deriving on every ref churn.
function webviewRefInject(ref: React.RefObject<WebView | null>, js: string) {
  ref.current?.injectJavaScript(js);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  offlineTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  offlineBody: { fontSize: 14, opacity: 0.7, marginBottom: 16, textAlign: "center" },
  retryButton: { backgroundColor: "#111827", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
