/**
 * Подписанная сессия в cookie (Web Crypto — совместимо с Edge middleware).
 * Для продакшена задайте AUTH_SECRET в окружении.
 */

export const PANEL_SESSION_COOKIE = "panel_session";

const DEFAULT_DEV_SECRET = "__smmplaner_dev_auth_secret_change_me__";

export function getPanelAuthSecret(): string {
  return process.env.AUTH_SECRET?.trim() || DEFAULT_DEV_SECRET;
}

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)!;
  return out;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const n = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(n)) return null;
    out[i] = n;
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function hexTimingSafeEqual(a: string, b: string): boolean {
  const ba = hexToBytes(a);
  const bb = hexToBytes(b);
  if (!ba || !bb) return false;
  return timingSafeEqualBytes(ba, bb);
}

export type PanelSessionPayload = {
  userId: string;
  login: string;
};

export async function createPanelSessionValue(
  userId: string,
  login: string
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payloadJson = JSON.stringify({ uid: userId, login, exp });
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(payloadJson));
  const sig = await hmacSha256Hex(getPanelAuthSecret(), payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyPanelSessionValue(
  value: string | undefined
): Promise<PanelSessionPayload | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!payloadB64 || !sig) return null;
  const expected = await hmacSha256Hex(getPanelAuthSecret(), payloadB64);
  if (!hexTimingSafeEqual(sig, expected)) return null;
  try {
    const raw = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const parsed = JSON.parse(raw) as { uid?: unknown; login?: unknown; exp?: unknown };
    if (
      typeof parsed.uid !== "string" ||
      typeof parsed.login !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: parsed.uid, login: parsed.login };
  } catch {
    return null;
  }
}

export const panelSessionCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
};
