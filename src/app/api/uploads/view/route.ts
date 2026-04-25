import { readFile } from "fs/promises";
import { join, normalize } from "path";
import type { NextRequest } from "next/server";
import { extFromBuffer, mimeFromImageExt } from "@/lib/uploadImageFormat";

/** Только `.bin` под `public/uploads/posts/` — узкая поверхность для гостей. */
const BIN_UPLOAD_PATH =
  /^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+\.bin$/i;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("p")?.trim() ?? "";
  let pathOnly: string;
  try {
    pathOnly = decodeURIComponent(raw).split("?")[0] ?? "";
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!BIN_UPLOAD_PATH.test(pathOnly)) {
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

  const guessedExt = extFromBuffer(buf);
  const contentType = guessedExt
    ? mimeFromImageExt(guessedExt)
    : "application/octet-stream";

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
