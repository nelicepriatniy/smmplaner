import { readFile } from "fs/promises";
import { join, normalize } from "path";
import type { NextRequest } from "next/server";
import { extFromBuffer, mimeFromImageExt } from "@/lib/uploadImageFormat";

/** Как при сохранении поста: только файлы из `public/uploads/posts/`. */
const UPLOAD_POST_WEB_PATH =
  /^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i;

function extFromPathname(pathname: string): string | null {
  const i = pathname.lastIndexOf(".");
  if (i < 0) return null;
  return pathname.slice(i).toLowerCase();
}

/**
 * Раздача загруженных картинок через Node (а не только статик из `public/`).
 * Нужно, когда nginx не проксирует `/uploads/` в Next или рабочая директория ≠ каталог с файлами.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("p")?.trim() ?? "";
  let pathOnly: string;
  try {
    pathOnly = decodeURIComponent(raw).split("?")[0] ?? "";
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!UPLOAD_POST_WEB_PATH.test(pathOnly)) {
    return new Response("Not found", { status: 404 });
  }

  const publicRoot = normalize(join(process.cwd(), "public"));
  const segments = pathOnly.split("/").filter(Boolean);
  const diskPath = normalize(join(publicRoot, ...segments));
  const allowedPrefix = normalize(join(publicRoot, "uploads", "posts"));

  if (!diskPath.startsWith(allowedPrefix)) {
    return new Response("Not found", { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(diskPath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const pathExt = extFromPathname(pathOnly);
  const fromExt = pathExt ? mimeFromImageExt(pathExt) : null;
  const contentType =
    !pathExt ||
    pathExt === ".bin" ||
    !fromExt ||
    fromExt === "application/octet-stream"
      ? (() => {
          const e = extFromBuffer(buf);
          return e ? mimeFromImageExt(e) : "application/octet-stream";
        })()
      : fromExt;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
