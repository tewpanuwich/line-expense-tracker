const MESSAGING_API_BASE = "https://api.line.me/v2/bot";
const CONTENT_API_BASE = "https://api-data.line.me/v2/bot";

function authHeaders(): Record<string, string> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN environment variable");
  return { Authorization: `Bearer ${token}` };
}

export async function getMessageContent(
  messageId: string
): Promise<{ data: ArrayBuffer; contentType: string }> {
  const response = await fetch(`${CONTENT_API_BASE}/message/${messageId}/content`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch LINE message content: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  return { data: await response.arrayBuffer(), contentType };
}

export async function getUserProfile(userId: string): Promise<{ displayName: string } | null> {
  const response = await fetch(`${MESSAGING_API_BASE}/profile/${userId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;

  const data = await response.json();
  return { displayName: typeof data.displayName === "string" ? data.displayName : "สมาชิกใหม่" };
}

type LineMessage =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: Record<string, unknown> };

async function replyMessages(replyToken: string, messages: LineMessage[]): Promise<void> {
  const response = await fetch(`${MESSAGING_API_BASE}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!response.ok) {
    console.error("LINE reply failed:", response.status, await response.text());
  }
}

export async function replyMessage(replyToken: string, text: string): Promise<void> {
  await replyMessages(replyToken, [{ type: "text", text }]);
}

export async function replyFlex(
  replyToken: string,
  altText: string,
  contents: Record<string, unknown>
): Promise<void> {
  await replyMessages(replyToken, [{ type: "flex", altText, contents }]);
}
