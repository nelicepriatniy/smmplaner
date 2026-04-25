/** Локальные загрузки в public — для next/image без оптимизации (нестандартные расширения, .bin и т.д.). */
export function isPublicUploadImageSrc(src: string): boolean {
  const s = src.trim();
  return s.startsWith("/uploads/");
}

/**
 * Относительный путь `/uploads/…` → абсолютный URL, если задан origin запроса (SSR, ссылка для клиента).
 * Полные http(s) и `//host/…` не трогаем (кроме дозаписи схемы для `//`).
 */
export function toAbsoluteMediaSrc(
  src: string,
  origin: string | null | undefined,
): string {
  const s = src.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) {
    const o = (origin ?? "").trim().toLowerCase();
    if (o.startsWith("http:")) return `http:${s}`;
    return `https:${s}`;
  }
  if (!s.startsWith("/")) return s;
  const base = origin?.replace(/\/+$/, "").trim() ?? "";
  if (!base) return s;
  return `${base}${s}`;
}

export function toAbsoluteMediaUrls(
  urls: string[],
  origin: string | null | undefined,
): string[] {
  return urls.map((u) => toAbsoluteMediaSrc(u, origin));
}
