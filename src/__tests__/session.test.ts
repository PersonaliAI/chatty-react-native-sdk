import { getOrCreateSessionId, newSession } from "../session";

describe("getOrCreateSessionId", () => {
  it("creates and persists a new id prefixed with v-", async () => {
    const id = await getOrCreateSessionId("bot-1");
    expect(id.startsWith("v-")).toBe(true);
  });

  it("returns the same id on repeated calls", async () => {
    const first = await getOrCreateSessionId("bot-2");
    const second = await getOrCreateSessionId("bot-2");
    expect(first).toBe(second);
  });

  it("gives independent ids for different botId or hostKey", async () => {
    const botA = await getOrCreateSessionId("bot-a");
    const botB = await getOrCreateSessionId("bot-b");
    const hostKeyed = await getOrCreateSessionId("bot-a", "widget");

    expect(botA).not.toBe(botB);
    expect(botA).not.toBe(hostKeyed);
  });
});

describe("newSession", () => {
  it("overwrites the previously stored id", async () => {
    const original = await getOrCreateSessionId("bot-3");
    const fresh = await newSession("bot-3");

    expect(fresh).not.toBe(original);
    expect(await getOrCreateSessionId("bot-3")).toBe(fresh);
  });

  it("scopes independently by hostKey", async () => {
    const appId = await newSession("bot-4", "app");
    const widgetId = await newSession("bot-4", "widget");
    expect(appId).not.toBe(widgetId);
  });
});
