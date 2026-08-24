import { ChattyClient, ChattyRateLimitError, ChattyDomainNotAllowedError, DEFAULT_BASE_URL } from "../api";

function mockFetchOnce(status: number, body: unknown, opts: { streamLines?: string[] } = {}) {
  const mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    body: opts.streamLines
      ? {
          getReader: () => {
            const lines = opts.streamLines!.map((l) => l + "\n");
            let i = 0;
            return {
              read: async () => {
                if (i >= lines.length) return { done: true, value: undefined };
                const value = new TextEncoder().encode(lines[i]);
                i++;
                return { done: false, value };
              },
            };
          },
        }
      : undefined,
  });
  (global as any).fetch = mock;
  return mock;
}

describe("ChattyClient.getTheme", () => {
  it("requests /api/widget/theme with bot_id and parses the JSON response", async () => {
    const fetchMock = mockFetchOnce(200, { name: "Acme", welcome_message: "hi" });
    const client = new ChattyClient({ botId: "bot-42" });

    const theme = await client.getTheme();

    expect(theme.name).toBe("Acme");
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`${DEFAULT_BASE_URL}/api/widget/theme`);
    expect(calledUrl).toContain("bot_id=bot-42");
  });

  it("throws a generic error on non-ok status", async () => {
    mockFetchOnce(500, {});
    const client = new ChattyClient({ botId: "bot-42" });
    await expect(client.getTheme()).rejects.toThrow("getTheme failed: 500");
  });
});

describe("ChattyClient.sendMessage", () => {
  it("posts bot_id/session_id/text/timezone/host in the JSON body", async () => {
    const fetchMock = mockFetchOnce(200, { reply: "hello back", session_id: "s1" });
    const client = new ChattyClient({ botId: "bot-42", host: "example.com" });

    const res = await client.sendMessage("s1", "hi there", "Asia/Colombo");

    expect(res.reply).toBe("hello back");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/widget/chat");
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toEqual({
      bot_id: "bot-42",
      session_id: "s1",
      text: "hi there",
      visitor_timezone: "Asia/Colombo",
      host: "example.com",
    });
  });

  it("sends host as undefined when not configured", async () => {
    const fetchMock = mockFetchOnce(200, { reply: "ok", session_id: "s1" });
    const client = new ChattyClient({ botId: "bot-42" });

    await client.sendMessage("s1", "hi");

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.host).toBeUndefined();
  });

  it("throws ChattyRateLimitError on 429", async () => {
    mockFetchOnce(429, {});
    const client = new ChattyClient({ botId: "bot-42" });
    await expect(client.sendMessage("s1", "hi")).rejects.toBeInstanceOf(ChattyRateLimitError);
  });

  it("throws ChattyDomainNotAllowedError on 403", async () => {
    mockFetchOnce(403, {});
    const client = new ChattyClient({ botId: "bot-42" });
    await expect(client.sendMessage("s1", "hi")).rejects.toBeInstanceOf(ChattyDomainNotAllowedError);
  });

  it("defaults visitor_timezone to UTC when not provided", async () => {
    const fetchMock = mockFetchOnce(200, { reply: "ok", session_id: "s1" });
    const client = new ChattyClient({ botId: "bot-42" });

    await client.sendMessage("s1", "hi");

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.visitor_timezone).toBe("UTC");
  });
});

describe("ChattyClient.poll", () => {
  it("builds the URL with bot_id, session_id, and after params", async () => {
    const fetchMock = mockFetchOnce(200, { messages: [], ai_paused: false });
    const client = new ChattyClient({ botId: "bot-42" });

    await client.poll("s1", "2026-01-01T00:00:00Z");

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("bot_id=bot-42");
    expect(calledUrl).toContain("session_id=s1");
    expect(calledUrl).toContain("after=2026-01-01T00%3A00%3A00Z");
  });
});

describe("ChattyClient.sendMessageStream", () => {
  it("emits tokens in order and stops at the done marker", async () => {
    mockFetchOnce(200, undefined, {
      streamLines: [
        'data: {"token":"Hel"}',
        'data: {"token":"lo"}',
        'data: {"done":true}',
        'data: {"token":"never seen"}',
      ],
    });
    const client = new ChattyClient({ botId: "bot-42" });
    const tokens: string[] = [];

    await client.sendMessageStream("s1", "hi", (t) => tokens.push(t));

    expect(tokens).toEqual(["Hel", "lo"]);
  });

  it("throws ChattyRateLimitError on 429 before reading the body", async () => {
    mockFetchOnce(429, undefined);
    const client = new ChattyClient({ botId: "bot-42" });
    await expect(client.sendMessageStream("s1", "hi", () => {})).rejects.toBeInstanceOf(ChattyRateLimitError);
  });

  it("ignores malformed SSE data lines instead of throwing", async () => {
    mockFetchOnce(200, undefined, {
      streamLines: ["data: not json", 'data: {"token":"ok"}', 'data: {"done":true}'],
    });
    const client = new ChattyClient({ botId: "bot-42" });
    const tokens: string[] = [];

    await client.sendMessageStream("s1", "hi", (t) => tokens.push(t));

    expect(tokens).toEqual(["ok"]);
  });
});
