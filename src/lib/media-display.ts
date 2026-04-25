import { getAppBaseUrl } from "@/lib/app-base-url";

/** Локальные загрузки в public — для next/image без оптимизации (нестандартные расширения, .bin и т.д.). */
export function isPublicUploadImageSrc(src: string): boolean {
  const s = src.trim();
  return s.startsWith("/uploads/");
}

/** Первое значение из `X-Forwarded-Host: a, b` (часто на проде несколько прокси). */
function firstCsvSegment(value: string | null | undefined): string {
  if (!value) return "";
  const t = value.trim();
  const i = t.indexOf(",");
  return (i === -1 ? t : t.slice(0, i).trim()) || "";
}

/**
 * Публичный origin для ссылок на медиа: заголовки запроса, иначе env (NEXT_PUBLIC_APP_URL и др.).
 */
export function getSiteOriginFromHeaders(headerList: Headers): string {
  const rawHost =
    firstCsvSegment(headerList.get("x-forwarded-host")) ||
    firstCsvSegment(headerList.get("host")) ||
    "";
  const rawProto =
    firstCsvSegment(headerList.get("x-forwarded-proto")) || "https";
  const proto = rawProto.toLowerCase().replace(/[^a-z]/g, "") || "https";
  const safeProto = proto === "http" ? "http" : "https";
  if (rawHost) {
    return `${safeProto}://${rawHost}`;
  }
  return getAppBaseUrl() ?? "";
}

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.endsWith(".localhost")
  );
}

function isAppUploadPath(pathname: string): boolean {
  return pathname.startsWith("/uploads/");
}

const UPLOAD_POST_WEB_PATH =
  /^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i;

/**
 * Отдаём загрузки через `/api/uploads/media`: тот же процесс, что пишет файлы при POST,
 * и корректный `Content-Type` (в т.ч. для старых `.bin`). Обходит проблемы nginx/статики.
 */
export function rewritePublicUploadMediaSrc(url: string): string {
  const s = url.trim();
  let pathname: string;
  let originPrefix = "";
  try {
    if (s.startsWith("//")) {
      const u = new URL(`https:${s}`);
      pathname = u.pathname;
      originPrefix = u.origin;
    } else if (s.startsWith("/")) {
      pathname = (s.split("?")[0] ?? s).trim();
    } else {
      const u = new URL(s);
      pathname = u.pathname;
      originPrefix = u.origin;
    }
  } catch {
    return s;
  }
  if (!UPLOAD_POST_WEB_PATH.test(pathname)) return s;
  const api = `/api/uploads/media?p=${encodeURIComponent(pathname)}`;
  return originPrefix ? `${originPrefix}${api}` : api;
}

/**
 * URL для `<img>`: относительные `/uploads/…` → абсолютные на текущий сайт;
 * полные URL с localhost (часто из дев-БД) и «чужой» хост при том же пути `/uploads/posts/…` → на `origin`.
 * Внешние CDN (другой путь) не трогаем.
 */
export function toAbsoluteMediaSrc(
  src: string,
  origin: string | null | undefined,
): string {
  const o = (origin ?? "").replace(/\/+$/, "").trim();
  const s = src.trim();
  if (!s) return s;

  let resolved: string;

  if (s.startsWith("//")) {
    const ol = o.toLowerCase();
    resolved = ol.startsWith("http:") ? `http:${s}` : `https:${s}`;
  } else if (s.startsWith("/")) {
    resolved = o ? `${o}${s}` : s;
  } else {
    let parsed: URL;
    try {
      parsed = new URL(s);
    } catch {
      return s;
    }

    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (o && isLoopbackHost(parsed.hostname)) {
      resolved = `${o}${path}`;
    } else if (o && isAppUploadPath(parsed.pathname)) {
      try {
        const base = new URL(o);
        if (parsed.hostname !== base.hostname) {
          resolved = `${o}${path}`;
        } else {
          resolved = s;
        }
      } catch {
        resolved = s;
      }
    } else {
      resolved = s;
    }
  }

  return rewritePublicUploadMediaSrc(resolved);
}

export function toAbsoluteMediaUrls(
  urls: string[],
  origin: string | null | undefined,
): string[] {
  return urls.map((u) => toAbsoluteMediaSrc(u, origin));
}
