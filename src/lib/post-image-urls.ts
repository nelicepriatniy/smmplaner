const UPLOAD_POST_WEB_PATH =
  /^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i;

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.endsWith(".localhost")
  );
}

function isValidPostUploadPath(pathOnly: string): boolean {
  if (!pathOnly.startsWith("/uploads/posts/") || pathOnly.includes("..")) {
    return false;
  }
  return UPLOAD_POST_WEB_PATH.test(pathOnly);
}

/**
 * Ссылки на картинки в редакторе приходят как
 * `http://localhost/.../api/uploads/media?p=%2Fuploads%2Fposts%2F...` (см. rewritePublicUploadMediaSrc).
 * В БД и в отправке в соцсети нужен путь `/uploads/posts/...`, иначе Telegram/VK получают
 * «localhost»-URL и падают с wrong HTTP URL / аналогом.
 */
export function normalizePostImageUrlForStorage(u: string): string {
  const t = u.trim();
  if (!t) return t;

  if (t.includes("api/uploads/media")) {
    try {
      const url = t.startsWith("/")
        ? new URL("http://placeholder.local" + t)
        : new URL(t);
      if (
        url.pathname === "/api/uploads/media" ||
        url.pathname.endsWith("/api/uploads/media")
      ) {
        const rawP = url.searchParams.get("p");
        if (rawP) {
          let pathOnly: string;
          try {
            pathOnly = decodeURIComponent(rawP).split("?")[0] ?? "";
          } catch {
            pathOnly = rawP;
          }
          if (isValidPostUploadPath(pathOnly)) return pathOnly;
        }
      }
    } catch {
      // ignore
    }
  }

  if (/^https?:\/\//i.test(t)) {
    try {
      const url = new URL(t);
      if (isLoopbackHost(url.hostname) && isValidPostUploadPath(url.pathname)) {
        return url.pathname;
      }
    } catch {
      // ignore
    }
  }

  return t;
}
