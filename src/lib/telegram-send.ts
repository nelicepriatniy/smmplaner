import { readFile } from "fs/promises";
import { basename, join } from "path";

const TG_CAPTION_MAX = 1024;

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clipCaption(html: string): string {
  if (html.length <= TG_CAPTION_MAX) return html;
  return `${html.slice(0, TG_CAPTION_MAX - 1)}…`;
}

type TelegramApiResponse = { ok: boolean; description?: string };

async function parseTelegramResponse(
  res: Response
): Promise<{ ok: true } | { ok: false; error: string }> {
  let json: TelegramApiResponse;
  try {
    json = (await res.json()) as TelegramApiResponse;
  } catch {
    return { ok: false, error: `HTTP ${res.status}: не JSON` };
  }
  if (!json.ok) {
    return {
      ok: false,
      error: json.description ?? `HTTP ${res.status}`,
    };
  }
  return { ok: true };
}

async function callTelegramJson(
  botToken: string,
  method: string,
  body: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/${method}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Сеть: ${msg}` };
  }
  return parseTelegramResponse(res);
}

async function callTelegramFormData(
  botToken: string,
  method: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/${method}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: formData });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Сеть: ${msg}` };
  }
  return parseTelegramResponse(res);
}

/** Только доверенные загрузки из public (как в sanitize при сохранении поста). */
function uploadsPublicFilePath(webPath: string): string | null {
  const u = webPath.trim();
  if (!u.startsWith("/uploads/posts/") || u.includes("..")) return null;
  if (!/^\/uploads\/posts\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(u)) return null;
  return join(process.cwd(), "public", u.slice(1));
}

function mimeForFilename(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
}

type ResolvedPhoto =
  | { kind: "url"; url: string }
  | { kind: "file"; absPath: string; filename: string };

function resolvePhoto(
  relativeOrAbsolute: string,
  appBaseUrl: string | null
): ResolvedPhoto | null {
  const u = relativeOrAbsolute.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return { kind: "url", url: u };
  if (u.startsWith("/")) {
    const disk = uploadsPublicFilePath(u);
    if (disk) return { kind: "file", absPath: disk, filename: basename(disk) };
    const base = appBaseUrl?.replace(/\/+$/, "") ?? "";
    if (!base) return null;
    return { kind: "url", url: `${base}${u}` };
  }
  return null;
}

function hasAnyFileAttachment(resolved: ResolvedPhoto[]): boolean {
  return resolved.some((r) => r.kind === "file");
}

/**
 * Отправляет подпись и до 10 фото (как в редакторе поста).
 * Локальные пути `/uploads/posts/…` читаются с диска и уходят в Telegram как файлы — без публичного URL.
 */
export async function sendPostToTelegramChat(input: {
  botToken: string;
  chatId: string;
  caption: string;
  imageUrls: string[];
  appBaseUrl: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { botToken, chatId } = input;
  const captionRaw = input.caption.trim();
  const captionHtml = captionRaw
    ? clipCaption(escapeTelegramHtml(captionRaw))
    : "";

  const resolved = input.imageUrls
    .map((x) => resolvePhoto(x, input.appBaseUrl))
    .filter((x): x is ResolvedPhoto => Boolean(x));

  if (resolved.length === 0) {
    if (!captionHtml) {
      return { ok: false, error: "Нет текста и изображений для отправки." };
    }
    return callTelegramJson(botToken, "sendMessage", {
      chat_id: chatId,
      text: captionHtml,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }

  if (resolved.length === 1) {
    const one = resolved[0]!;
    if (one.kind === "url") {
      const body: Record<string, unknown> = {
        chat_id: chatId,
        photo: one.url,
      };
      if (captionHtml) {
        body.caption = captionHtml;
        body.parse_mode = "HTML";
      }
      return callTelegramJson(botToken, "sendPhoto", body);
    }
    let buf: Buffer;
    try {
      buf = await readFile(one.absPath);
    } catch {
      return {
        ok: false,
        error: `Не удалось прочитать файл изображения: ${one.filename}`,
      };
    }
    const fd = new FormData();
    fd.set("chat_id", chatId);
    fd.set(
      "photo",
      new File([new Uint8Array(buf)], one.filename, {
        type: mimeForFilename(one.filename),
      })
    );
    if (captionHtml) {
      fd.set("caption", captionHtml);
      fd.set("parse_mode", "HTML");
    }
    return callTelegramFormData(botToken, "sendPhoto", fd);
  }

  const capped = resolved.slice(0, 10);

  if (!hasAnyFileAttachment(capped)) {
    const media = capped.map((item, i) => {
      const url = (item as { kind: "url"; url: string }).url;
      if (i === 0 && captionHtml) {
        return {
          type: "photo",
          media: url,
          caption: captionHtml,
          parse_mode: "HTML",
        };
      }
      return { type: "photo", media: url };
    });
    return callTelegramJson(botToken, "sendMediaGroup", {
      chat_id: chatId,
      media,
    });
  }

  const fd = new FormData();
  fd.set("chat_id", chatId);
  const media: Record<string, unknown>[] = [];
  let fileCounter = 0;

  for (let i = 0; i < capped.length; i++) {
    const item = capped[i]!;
    if (item.kind === "url") {
      media.push(
        i === 0 && captionHtml
          ? {
              type: "photo",
              media: item.url,
              caption: captionHtml,
              parse_mode: "HTML",
            }
          : { type: "photo", media: item.url }
      );
      continue;
    }
    const attachName = `p${fileCounter}`;
    fileCounter += 1;
    let buf: Buffer;
    try {
      buf = await readFile(item.absPath);
    } catch {
      return {
        ok: false,
        error: `Не удалось прочитать файл изображения: ${item.filename}`,
      };
    }
    fd.set(
      attachName,
      new File([new Uint8Array(buf)], item.filename, {
        type: mimeForFilename(item.filename),
      })
    );
    media.push(
      i === 0 && captionHtml
        ? {
            type: "photo",
            media: `attach://${attachName}`,
            caption: captionHtml,
            parse_mode: "HTML",
          }
        : { type: "photo", media: `attach://${attachName}` }
    );
  }

  fd.set("media", JSON.stringify(media));
  return callTelegramFormData(botToken, "sendMediaGroup", fd);
}
