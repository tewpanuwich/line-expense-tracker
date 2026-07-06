// Edge-safe session token sign/verify (Web Crypto only) — importable from
// middleware.ts (Edge runtime) as well as Node server actions/components.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface SessionPayload {
  memberId: string;
  isAdmin: boolean;
}

interface SignedPayload extends SessionPayload {
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLength));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  payload: SessionPayload,
  secret: string,
  maxAgeSeconds: number
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const signed: SignedPayload = { ...payload, exp };
  const bodyBytes = encoder.encode(JSON.stringify(signed));
  const key = await getKey(secret);
  const signatureBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, bodyBytes));
  return `${base64UrlEncode(bodyBytes)}.${base64UrlEncode(signatureBytes)}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  let bodyBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  try {
    bodyBytes = base64UrlDecode(parts[0]);
    signatureBytes = base64UrlDecode(parts[1]);
  } catch {
    return null;
  }

  const key = await getKey(secret);
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as BufferSource,
    bodyBytes as BufferSource
  );
  if (!isValid) return null;

  let payload: SignedPayload;
  try {
    payload = JSON.parse(decoder.decode(bodyBytes));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { memberId: payload.memberId, isAdmin: payload.isAdmin };
}
