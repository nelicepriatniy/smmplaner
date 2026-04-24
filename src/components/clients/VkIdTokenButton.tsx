"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_SCOPE = "wall,photos,offline";

type VkIdTokenButtonProps = {
  /** Подставить access token в форму клиента ВК. */
  onAccessToken: (accessToken: string) => void;
  disabled?: boolean;
};

/**
 * Виджет VK ID One Tap: после входа обменивает code на access_token и передаёт в форму.
 * Нужны `NEXT_PUBLIC_VK_APP_ID` и `NEXT_PUBLIC_VK_REDIRECT_URL` (как в настройках приложения VK).
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

          sdk.Config.init({
            app: appId,
            redirectUrl,
            responseMode: sdk.ConfigResponseMode.Callback,
            source: sdk.ConfigSource.LOWCODE,
            scope,
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
                const p = payload as { code?: string; device_id?: string };
                if (!p?.code || !p?.device_id) {
                  setLocalError("VK ID: в ответе нет code или device_id.");
                  return;
                }
                try {
                  const data = await sdk.Auth.exchangeCode(p.code, p.device_id);
                  onTokenRef.current(data.access_token);
                  setTokenOk(true);
                } catch (e: unknown) {
                  if (
                    e &&
                    typeof e === "object" &&
                    "error_description" in e &&
                    typeof (e as { error_description?: string }).error_description ===
                      "string"
                  ) {
                    setLocalError(
                      (e as { error_description: string }).error_description
                    );
                  } else if (e instanceof Error) {
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
