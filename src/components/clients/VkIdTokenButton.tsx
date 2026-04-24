"use client";

import { useEffect, useRef, useState } from "react";

/** Права для api.vk.com: стена, фото, сообщества (для поста от имени группы), долгоживущий токен. */
const DEFAULT_SCOPE = "wall,photos,groups,offline";

/** Как в @vkid/sdk `getCookie` — читаем PKCE после LOGIN_SUCCESS. */
function readVkidSdkCookie(name: string): string | undefined {
  try {
    const re = new RegExp(
      "(?:^|; )" +
        ("vkid_sdk:" + name).replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1") +
        "=([^;]*)"
    );
    const m = document.cookie.match(re);
    return m?.[1] ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined;
  }
}

/** Сброс PKCE-cookies после успешного обмена (аналог SDK `clear*Cookie`). */
function clearVkidSdkCookie(name: string) {
  try {
    const allowedDomain = location.host.split(".").slice(-2).join(".");
    document.cookie = [
      `vkid_sdk:${name}=`,
      "expires=Thu, 01 Jan 1970 00:00:00 UTC",
      "path=/",
      "SameSite=Strict",
      "Secure",
      `domain=.${allowedDomain}`,
    ].join("; ");
  } catch {
    /* ignore */
  }
}

async function exchangeCodeViaApi(body: {
  code: string;
  device_id: string;
  code_verifier: string;
  state: string;
}): Promise<{ access_token: string }> {
  const signal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(25_000)
      : undefined;
  let res: Response;
  try {
    res = await fetch("/api/vk/oauth-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Превышено время ожидания (25 с): нет ответа от приложения. Если сервер не может достучаться до id.vk.ru, проверьте исходящий HTTPS с хостинга.",
      );
    }
    throw e;
  }
  let data: { access_token?: string; error?: string };
  try {
    data = (await res.json()) as { access_token?: string; error?: string };
  } catch {
    throw new Error(`Сервер вернул не JSON (HTTP ${res.status}).`);
  }
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  if (!data.access_token) {
    throw new Error("В ответе сервера нет access_token.");
  }
  return { access_token: data.access_token };
}

/** Singleton Auth в @vkid/sdk: после login() держит codeVerifier до обмена кода. */
type VkIdAuthRuntime = { codeVerifier?: string };

type VkIdTokenButtonProps = {
  /** Подставить access token в форму клиента ВК. */
  onAccessToken: (accessToken: string) => void;
  disabled?: boolean;
};

/**
 * Виджет VK ID One Tap: после входа обменивает code на access_token и передаёт в форму.
 * Нужны `NEXT_PUBLIC_VK_APP_ID` и `NEXT_PUBLIC_VK_REDIRECT_URL` (как в настройках приложения VK).
 * Для `wall.post` в кабинете VK ID должны быть разрешены доступы к API (см. `NEXT_PUBLIC_VK_SCOPE`).
 */
export function VkIdTokenButton({ onAccessToken, disabled }: VkIdTokenButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ close: () => void } | null>(null);
  const onTokenRef = useRef(onAccessToken);
  onTokenRef.current = onAccessToken;

  const [hint, setHint] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [tokenOk, setTokenOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [httpWarn, setHttpWarn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:") {
      setHttpWarn(true);
    }
  }, []);

  useEffect(() => {
    setHint(null);
    setLocalError(null);
    setTokenOk(false);
    setLoading(false);
    if (disabled) return;

    const appIdRaw = process.env.NEXT_PUBLIC_VK_APP_ID?.trim();
    const redirectUrl = process.env.NEXT_PUBLIC_VK_REDIRECT_URL?.trim();
    if (!appIdRaw || !redirectUrl) {
      setHint(
        "В .env или .env.local задайте NEXT_PUBLIC_VK_APP_ID и NEXT_PUBLIC_VK_REDIRECT_URL (тот же URL, что в настройках приложения VK → доверенные redirect URI), затем перезапустите dev-сервер.",
      );
      return;
    }
    const appId = Number.parseInt(appIdRaw, 10);
    if (Number.isNaN(appId)) {
      setHint("NEXT_PUBLIC_VK_APP_ID должен быть числом (ID приложения VK).");
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const sdk = await import("@vkid/sdk");
        if (cancelled) return;

        const mount = () => {
          if (cancelled || !containerRef.current) return false;

          const scope = process.env.NEXT_PUBLIC_VK_SCOPE?.trim() || DEFAULT_SCOPE;
          const host =
            typeof window !== "undefined" ? window.location.hostname : "";
          const localhost =
            host === "localhost" ||
            host === "127.0.0.1" ||
            host === "[::1]";

          sdk.Config.init({
            app: appId,
            redirectUrl,
            responseMode: sdk.ConfigResponseMode.Callback,
            source: sdk.ConfigSource.LOWCODE,
            scope,
            __localhost: localhost,
          });

          const oneTap = new sdk.OneTap();
          widgetRef.current = oneTap;

          oneTap
            .render({
              container: containerRef.current,
              showAlternativeLogin: true,
            })
            .on(sdk.WidgetEvents.ERROR, (err: { text?: string }) => {
              if (cancelled) return;
              setLocalError(err?.text ?? "Ошибка виджета VK ID");
            })
            .on(sdk.OneTapInternalEvents.LOGIN_SUCCESS, (payload: unknown) => {
              void (async () => {
                if (cancelled) return;
                setLocalError(null);
                const p = payload as {
                  code?: string;
                  device_id?: string;
                  state?: string;
                };
                if (!p?.code || !p?.device_id) {
                  setLocalError("VK ID: в ответе нет code или device_id.");
                  return;
                }
                /**
                 * state: SDK перед успехом вызывает clearStateCookie() — в document.cookie
                 * его уже нет; нужное значение приходит в payload (см. AuthResponse.state).
                 * code_verifier: cookie или память singleton Auth после login().
                 */
                const authRt = sdk.Auth as unknown as VkIdAuthRuntime;
                const codeVerifier =
                  readVkidSdkCookie("codeVerifier")?.trim() ||
                  authRt.codeVerifier?.trim();
                const state =
                  p.state?.trim() || readVkidSdkCookie("state")?.trim();
                if (!state) {
                  setLocalError(
                    "VK ID: в ответе нет state (ожидается после входа). Обновите страницу и попробуйте снова.",
                  );
                  return;
                }
                if (!codeVerifier) {
                  setLocalError(
                    "Нет PKCE code_verifier (cookie vkid_sdk:codeVerifier и внутреннее состояние SDK пусты). Обновите страницу и войдите снова; на http://localhost включите HTTPS — иначе Secure-cookie не сохранится.",
                  );
                  return;
                }
                try {
                  const data = await exchangeCodeViaApi({
                    code: p.code,
                    device_id: p.device_id,
                    code_verifier: codeVerifier,
                    state,
                  });
                  clearVkidSdkCookie("codeVerifier");
                  clearVkidSdkCookie("state");
                  onTokenRef.current(data.access_token);
                  setTokenOk(true);
                } catch (e: unknown) {
                  if (e instanceof Error) {
                    setLocalError(e.message);
                  } else {
                    setLocalError("Не удалось обменять код на токен (VK ID).");
                  }
                }
              })();
            });
          return true;
        };

        const ok = typeof requestAnimationFrame === "function"
          ? await new Promise<boolean>((resolve) => {
              requestAnimationFrame(() => {
                resolve(mount());
              });
            })
          : mount();

        if (!ok && !cancelled) {
          setLocalError("Не удалось отрисовать виджет: контейнер недоступен. Обновите страницу.");
        }
      } catch (e) {
        if (!cancelled) {
          setLocalError(
            e instanceof Error ? e.message : "Не удалось загрузить VK ID SDK.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      widgetRef.current?.close();
      widgetRef.current = null;
    };
  }, [disabled]);

  return (
    <div className="space-y-2">
      {httpWarn ? (
        <p className="text-[12px] leading-relaxed text-amber-200/90">
          Сайт открыт по HTTP: у VK ID cookies с флагом Secure — для входа через виджет
          нужен HTTPS (например локально через `next dev --experimental-https` или туннель).
        </p>
      ) : null}
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
        {hint ? (
          <p className="p-3 text-[12px] leading-relaxed text-[var(--muted)]">{hint}</p>
        ) : (
          <>
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--background)_92%,transparent)] text-[13px] text-[var(--muted)] backdrop-blur-[2px]">
                Загрузка виджета VK…
              </div>
            ) : null}
            <div
              ref={containerRef}
              className="min-h-[52px] w-full px-2 py-2"
            />
          </>
        )}
      </div>
      {localError ? (
        <p
          className="text-[12px] leading-relaxed text-rose-200"
          role="alert"
        >
          {localError}
        </p>
      ) : null}
      {tokenOk ? (
        <p className="text-[12px] text-emerald-200/90">
          Токен получен и подставлен в поле «Access token» ниже — сохраните клиента.
        </p>
      ) : null}
    </div>
  );
}
