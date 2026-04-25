function firstHeaderSegment(value: string | null | undefined): string {
  if (!value) return "";
  const t = value.trim();
  const i = t.indexOf(",");
  return (i === -1 ? t : t.slice(0, i).trim()) || "";
}

/**
 * Публичный origin сайта (для ссылок на загруженные файлы в /public).
 * Telegram забирает медиа по URL с своих серверов — без публичного URL локальные /uploads/… не сработают.
 */
export function getAppBaseUrl(): string | null {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : "");
  if (!fromEnv) return null;
  return fromEnv.replace(/\/+$/, "");
}

/**
 * Сначала env (каноничный URL на проде), иначе origin из заголовка запроса
 * (локальный `next dev` без .env, за прокси с Host).
 * Для cron/фоновых задач без `Headers` — только `getAppBaseUrl()`.
 */
export function getAppBaseUrlOrFromRequestHeaders(
  requestHeaders: Headers
): string | null {
  const fromEnv = getAppBaseUrl();
  if (fromEnv) return fromEnv;

  const rawHost =
    firstHeaderSegment(requestHeaders.get("x-forwarded-host")) ||
    firstHeaderSegment(requestHeaders.get("host")) ||
    "";
  if (!rawHost) return null;

  const rawProto = firstHeaderSegment(requestHeaders.get("x-forwarded-proto"));
  const lowerH = rawHost.toLowerCase();
  const isLoopbackish =
    lowerH === "localhost" ||
    lowerH.startsWith("localhost:") ||
    lowerH === "127.0.0.1" ||
    lowerH.startsWith("127.0.0.1:") ||
    lowerH.startsWith("[::1]") ||
    /^\[::1\]/.test(rawHost);
  const proto = rawProto
    ? /http/i.test(rawProto)
      ? "http"
      : "https"
    : isLoopbackish
      ? "http"
      : "https";

  return `${proto}://${rawHost}`.replace(/\/+$/, "");
}
