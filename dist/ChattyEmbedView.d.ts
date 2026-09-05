import React from "react";
export declare const chattyDefaultEmbedBaseUrl = "https://chatty.personaliai.com";
export declare const BRIDGE_SHIM_JS = "\n(function() {\n  if (window.__chattyBridgeInstalled) { return true; }\n  window.__chattyBridgeInstalled = true;\n  // MessageEvent's constructor only accepts a Window or MessagePort for\n  // 'source' (not a generic EventTarget, and definitely not a plain object\n  // literal) \u2014 a MessagePort from a throwaway MessageChannel is the only\n  // one of those we can actually construct standalone. Its native\n  // postMessage is shadowed with our own override (own-property lookup\n  // beats the prototype's), so the port itself is never really used to\n  // send anything, only to satisfy the type check and as a stable\n  // identity for the page's own 'e.source !== window.parent' filter.\n  var fakeParent = new MessageChannel().port1;\n  fakeParent.postMessage = function(data) {\n    try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch (e) {}\n  };\n  try {\n    Object.defineProperty(window, 'parent', { get: function() { return fakeParent; }, configurable: true });\n  } catch (e) {}\n  window.__chattyDeliver = function(json) {\n    try {\n      var data = JSON.parse(json);\n      window.dispatchEvent(new MessageEvent('message', { data: data, source: fakeParent }));\n    } catch (e) {}\n  };\n  // Suppress raw browser window.alert() calls (e.g. \"Browser push notifications\n  // are not supported on this browser\" from EmbedClient.tsx) which would otherwise\n  // render as a jarring browser dialog.\n  try {\n    window.alert = function(msg) {\n      try { console.log('[ChattyBridge] alert suppressed: ' + msg); } catch (e) {}\n    };\n  } catch (e) {}\n  // Intercept getUserMedia so native host knows mic access was requested.\n  try {\n    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {\n      var _origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);\n      navigator.mediaDevices.getUserMedia = function(constraints) {\n        try { fakeParent.postMessage({ type: 'chatty:mic-requested' }); } catch (e) {}\n        return _origGUM(constraints);\n      };\n    }\n  } catch (e) {}\n  // Intercept geolocation so native host knows location access was requested.\n  try {\n    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {\n      var _origGCP = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);\n      navigator.geolocation.getCurrentPosition = function(success, error, options) {\n        try { fakeParent.postMessage({ type: 'chatty:location-requested' }); } catch (e) {}\n        return _origGCP(success, error, options);\n      };\n    }\n  } catch (e) {}\n  true;\n})();\n";
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
/**
 * Loads the bot's own web widget page (the exact code chatty.personaliai.com
 * serves at /embed/[botId]) inside a WebView — guaranteed pixel-for-pixel and
 * feature-for-feature parity with the web widget, since it IS the web widget,
 * not a native reimplementation of it. Trades native scroll/animation feel
 * for zero parity drift; see ChattyChatView for the native-components version.
 */
export declare function ChattyEmbedView(props: ChattyEmbedViewProps): React.JSX.Element;
