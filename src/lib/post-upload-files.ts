import { unlink } from "fs/promises";
import { join } from "path";

/**
 * Абсолютный путь к файлу в `public/uploads/posts/{userId}/…`, только если URL
 * принадлежит этому пользователю и не содержит обхода каталога.
 */
export function postUploadAbsPathForUser(
  userId: string,
  webPath: string
): string | null {
  const u = webPath.trim();
  if (!u.startsWith("/uploads/posts/") || u.includes("..")) return null;
  if (!/^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(u)) return null;
  const m = u.match(/^\/uploads\/posts\/([a-z0-9_-]+)\/([a-z0-9_.-]+)$/i);
  if (!m || m[1] !== userId) return null;
  return join(process.cwd(), "public", u.slice(1));
}

/** Удаляет только локальные файлы из `/uploads/posts/{userId}/`; внешние URL не трогает. */
export async function deletePostUploadedImageFiles(
  userId: string,
  imageUrls: unknown
): Promise<void> {
  if (!Array.isArray(imageUrls)) return;
  for (const item of imageUrls) {
    if (typeof item !== "string") continue;
    const abs = postUploadAbsPathForUser(userId, item);
    if (!abs) continue;
    try {
      await unlink(abs);
    } catch {
      // файл уже удалён или недоступен — не блокируем удаление поста
    }
  }
}
