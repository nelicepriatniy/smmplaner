import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Домен OAuth VK ID (как в @vkid/sdk constants). */
const VKID_HOST = "id.vk.ru";

/**
 * Обмен authorization code на access_token на сервере (обход блокировок fetch к id.vk.ru из браузера).
 * Клиент передаёт `state` из payload LOGIN_SUCCESS (cookie state SDK очищает до события) и
 * `code_verifier` из cookie и/или из памяти singleton Auth после login().
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нужна авторизация." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }
  const b = body as {
    code?: string;
    device_id?: string;
    code_verifier?: string;
    state?: string;
  };
  const code = b.code?.trim();
  const deviceId = b.device_id?.trim();
  const codeVerifier = b.code_verifier?.trim();
  const state = b.state?.trim();

  if (!code || !deviceId || !codeVerifier || !state) {
    return NextResponse.json(
      {
        error:
          "Нужны поля code, device_id, code_verifier и state (state — из ответа VK ID после входа, не из cookie).",
      },
      { status: 400 }
    );
  }

  const appId = process.env.NEXT_PUBLIC_VK_APP_ID?.trim();
  const redirectUrl = process.env.NEXT_PUBLIC_VK_REDIRECT_URL?.trim();
  if (!appId || !redirectUrl) {
    return NextResponse.json(
      { error: "На сервере не заданы NEXT_PUBLIC_VK_APP_ID и NEXT_PUBLIC_VK_REDIRECT_URL." },
      { status: 500 }
    );
  }

  const qs = new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: redirectUrl,
    client_id: appId,
    code_verifier: codeVerifier,
    state,
    device_id: deviceId,
  });
  const url = `https://${VKID_HOST}/oauth2/auth?${qs.toString()}`;

  const vkSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(20_000)
      : undefined;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "smmplaner (VK ID oauth-exchange)",
      },
      body: new URLSearchParams({ code }),
      cache: "no-store",
      signal: vkSignal,
    });
  } catch (e) {
    const aborted =
      e instanceof Error && e.name === "AbortError";
    console.error("[vk oauth-exchange] fetch to id.vk.ru failed", e);
    return NextResponse.json(
      {
        error: aborted
          ? "Таймаут 20 с при запросе к id.vk.ru. Проверьте, что с сервера доступен HTTPS к VK (файрвол, DNS, маршрутизация)."
          : "Сервер не смог связаться с id.vk.ru. Проверьте исходящий HTTPS, DNS и что хостинг не режет внешние запросы.",
      },
      { status: aborted ? 504 : 502 }
    );
  }

  const raw = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        error: `Ответ VK не JSON (HTTP ${res.status}). ${raw.slice(0, 200)}`,
      },
      { status: 502 }
    );
  }

  if ("error" in json) {
    const desc =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.error === "string"
          ? json.error
          : "Ошибка OAuth VK";
    return NextResponse.json({ error: desc }, { status: 400 });
  }

  const accessToken =
    typeof json.access_token === "string" ? json.access_token : "";
  if (!accessToken) {
    return NextResponse.json({ error: "В ответе VK нет access_token." }, { status: 502 });
  }
  if (typeof json.state === "string" && json.state !== state) {
    return NextResponse.json({ error: "Несовпадение state в ответе VK." }, { status: 400 });
  }

  return NextResponse.json({
    access_token: accessToken,
    expires_in: json.expires_in,
    scope: json.scope,
  });
}
