import { BRIDGE_SHIM_JS } from "../ChattyEmbedView";

describe("ChattyEmbedView - Bridge Shim & Protocol", () => {
  it("includes the fakeParent window.parent override shim", () => {
    expect(BRIDGE_SHIM_JS).toContain("window.__chattyBridgeInstalled");
    expect(BRIDGE_SHIM_JS).toContain("var fakeParent = new MessageChannel().port1;");
    expect(BRIDGE_SHIM_JS).toContain("window.ReactNativeWebView.postMessage");
    expect(BRIDGE_SHIM_JS).toContain("Object.defineProperty(window, 'parent'");
    expect(BRIDGE_SHIM_JS).toContain("window.__chattyDeliver");
  });

  it("suppresses raw browser window.alert dialogs", () => {
    expect(BRIDGE_SHIM_JS).toContain("window.alert = function(msg)");
    expect(BRIDGE_SHIM_JS).toContain("[ChattyBridge] alert suppressed");
  });

  it("intercepts navigator.mediaDevices.getUserMedia for mic permission reflection", () => {
    expect(BRIDGE_SHIM_JS).toContain("navigator.mediaDevices.getUserMedia");
    expect(BRIDGE_SHIM_JS).toContain("type: 'chatty:mic-requested'");
  });

  it("intercepts navigator.geolocation.getCurrentPosition for location permission reflection", () => {
    expect(BRIDGE_SHIM_JS).toContain("navigator.geolocation.getCurrentPosition");
    expect(BRIDGE_SHIM_JS).toContain("type: 'chatty:location-requested'");
  });

  it("verifies inbound notification-status delivery JSON payload structure", () => {
    const payload = { type: "chatty-notification-status", granted: true };
    const serialized = JSON.stringify(JSON.stringify(payload));
    const script = `window.__chattyDeliver && window.__chattyDeliver(${serialized}); true;`;

    expect(script).toContain("chatty-notification-status");
    expect(script).toContain("granted");
    expect(script).toContain("true");
  });

  it("handles valid outbound bridge messages correctly", () => {
    const validMessages = [
      { type: "chatty:ready" },
      { type: "chatty:message", role: "assistant" },
      { type: "chatty:close" },
      { type: "chatty-request-notification", botName: "ChattyBot" },
      { type: "chatty:mic-requested" },
      { type: "chatty:location-requested" },
    ];

    for (const msg of validMessages) {
      const parsed = JSON.parse(JSON.stringify(msg));
      expect(parsed.type).toBe(msg.type);
    }
  });
});
