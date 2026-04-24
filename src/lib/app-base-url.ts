/**
 * Публичный origin сайта (для ссылок на загруженные файлы в /public).
 * Telegram забирает медиа по URL с своих серверов — без публичного URL локальные /uploads/… не сработают.
 */
export function getAppBaseUrl(): string | null {
  const fromEnv =
    process.env.APP_BASE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : "");
  if (!fromEnv) return null;
  return fromEnv.replace(/\/+$/, "");
}
