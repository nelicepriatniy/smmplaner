import dns from "node:dns";
import { readFile } from "fs/promises";
import { basename, join } from "path";
import { normalizePostImageUrlForStorage } from "@/lib/post-image-urls";

/** На VPS часто «IPv6 unreachable», а AAAA в DNS есть — тогда Node раньше ходил в тупик по v6. */
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

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

/** Цепочка message/cause у TypeError fetch failed — на проде часто виден ECONNREFUSED, ENOTFOUND, ETIMEDOUT. */
function describeFetchFailure(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let i = 0; i < 6 && cur instanceof Error; i += 1) {
    const m = cur.message.trim();
    if (m && !parts.includes(m)) parts.push(m);
    cur = cur.cause;
  }
  if (parts.length === 0) return String(e);
  return parts.join(" → ");
}

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
    console.error("[telegram] fetch to api.telegram.org failed", e);
    return {
      ok: false,
      error: `Нет связи с api.telegram.org (${describeFetchFailure(e)}). Проверьте исходящий доступ с сервера (файрвол, DNS, IPv6).`,
    };
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
    console.error("[telegram] fetch to api.telegram.org failed", e);
    return {
      ok: false,
      error: `Нет связи с api.telegram.org (${describeFetchFailure(e)}). Проверьте исходящий доступ с сервера (файрвол, DNS, IPv6).`,
    };
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
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "application/octet-stream";
}

/** Форматы, которые Telegram часто не принимает в sendPhoto / sendMediaGroup (photo) → IMAGE_PROCESS_FAILED. */
function preferSendImageAsDocument(fileOrUrl: string): boolean {
  const path = (fileOrUrl.split("?")[0] ?? "").toLowerCase();
  return /\.(webp|avif|heic|heif|gif|bmp|tif|tiff|svg)$/.test(path);
}

function isTelegramImageProcessFailed(error: string): boolean {
  return /\bIMAGE_PROCESS_FAILED\b/i.test(error);
}

type ResolvedPhoto =
  | { kind: "url"; url: string }
  | { kind: "file"; absPath: string; filename: string };

type ReadyPhoto =
  | { kind: "url"; url: string }
  | { kind: "file"; data: Buffer; filename: string };

function resolvePhoto(
  relativeOrAbsolute: string,
  appBaseUrl: string | null
): ResolvedPhoto | null {
  const u = normalizePostImageUrlForStorage(relativeOrAbsolute).trim();
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

/** Недоступные файлы на диске пропускаем — уйдёт текст или оставшиеся картинки. */
async function materializeResolvedPhotos(
  resolved: ResolvedPhoto[]
): Promise<ReadyPhoto[]> {
  const out: ReadyPhoto[] = [];
  for (const r of resolved) {
    if (r.kind === "url") {
      out.push(r);
      continue;
    }
    try {
      const buf = await readFile(r.absPath);
      out.push({
        kind: "file",
        data: buf,
        filename: r.filename,
      });
    } catch (e) {
      console.warn(
        "[telegram] пропуск изображения (файл не прочитан):",
        r.filename,
        e
      );
    }
  }
  return out;
}

function hasAnyFileAttachment(ready: ReadyPhoto[]): boolean {
  return ready.some((r) => r.kind === "file");
}

function mediaKindForReady(item: ReadyPhoto): "photo" | "document" {
  const src = item.kind === "url" ? item.url : item.filename;
  return preferSendImageAsDocument(src) ? "document" : "photo";
}

async function sendSingleImageOrDocument(
  botToken: string,
  chatId: string,
  one: ReadyPhoto,
  captionHtml: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sendDocument = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (one.kind === "url") {
      const body: Record<string, unknown> = { chat_id: chatId, document: one.url };
      if (captionHtml) {
        body.caption = captionHtml;
        body.parse_mode = "HTML";
      }
      return callTelegramJson(botToken, "sendDocument", body);
    }
    const fd = new FormData();
    fd.set("chat_id", chatId);
    fd.set(
      "document",
      new File([new Uint8Array(one.data)], one.filename, {
        type: mimeForFilename(one.filename),
      })
    );
    if (captionHtml) {
      fd.set("caption", captionHtml);
      fd.set("parse_mode", "HTML");
    }
    return callTelegramFormData(botToken, "sendDocument", fd);
  };

  const sendPhoto = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
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
    const fd = new FormData();
    fd.set("chat_id", chatId);
    fd.set(
      "photo",
      new File([new Uint8Array(one.data)], one.filename, {
        type: mimeForFilename(one.filename),
      })
    );
    if (captionHtml) {
      fd.set("caption", captionHtml);
      fd.set("parse_mode", "HTML");
    }
    return callTelegramFormData(botToken, "sendPhoto", fd);
  };

  if (mediaKindForReady(one) === "document") {
    return sendDocument();
  }

  const photoRes = await sendPhoto();
  if (photoRes.ok) return photoRes;
  if (!isTelegramImageProcessFailed(photoRes.error)) return photoRes;

  const docRes = await sendDocument();
  if (docRes.ok) return docRes;
  return {
    ok: false,
    error:
      `${photoRes.error} Повтор как файл: ${docRes.error}. Часто помогает сохранить изображение как JPEG или PNG (до ~10 МБ) и загрузить снова.`,
  };
}

/**
 * Отправляет подпись и до 10 фото (как в редакторе поста).
 * Локальные пути `/uploads/posts/…` читаются с диска и уходят в Telegram как файлы — без публичного URL.
 * Если файл на диске недоступен, он пропускается; при отсутствии всех медиа уходит только подпись.
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

  const ready = (await materializeResolvedPhotos(resolved)).slice(0, 10);

  if (ready.length === 0) {
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

  if (ready.length === 1) {
    return sendSingleImageOrDocument(botToken, chatId, ready[0]!, captionHtml);
  }

  if (!hasAnyFileAttachment(ready)) {
    const buildMedia = (forceDocument: boolean) =>
      ready.map((item, i) => {
        const url = (item as { kind: "url"; url: string }).url;
        const t =
          forceDocument || preferSendImageAsDocument(url) ? "document" : "photo";
        if (i === 0 && captionHtml) {
          return {
            type: t,
            media: url,
            caption: captionHtml,
            parse_mode: "HTML",
          };
        }
        return { type: t, media: url };
      });
    const media = buildMedia(false);
    const first = await callTelegramJson(botToken, "sendMediaGroup", {
      chat_id: chatId,
      media,
    });
    if (first.ok) return first;
    if (!isTelegramImageProcessFailed(first.error)) return first;
    return callTelegramJson(botToken, "sendMediaGroup", {
      chat_id: chatId,
      media: buildMedia(true),
    });
  }

  const fd = new FormData();
  fd.set("chat_id", chatId);
  const media: Record<string, unknown>[] = [];
  let fileCounter = 0;

  const attachNames: string[] = [];

  for (let i = 0; i < ready.length; i++) {
    const item = ready[i]!;
    const kind = mediaKindForReady(item);
    if (item.kind === "url") {
      media.push(
        i === 0 && captionHtml
          ? {
              type: kind,
              media: item.url,
              caption: captionHtml,
              parse_mode: "HTML",
            }
          : { type: kind, media: item.url }
      );
      continue;
    }
    const attachName = `p${fileCounter}`;
    fileCounter += 1;
    attachNames.push(attachName);
    fd.set(
      attachName,
      new File([new Uint8Array(item.data)], item.filename, {
        type: mimeForFilename(item.filename),
      })
    );
    media.push(
      i === 0 && captionHtml
        ? {
            type: kind,
            media: `attach://${attachName}`,
            caption: captionHtml,
            parse_mode: "HTML",
          }
        : { type: kind, media: `attach://${attachName}` }
    );
  }

  fd.set("media", JSON.stringify(media));
  const firstTry = await callTelegramFormData(botToken, "sendMediaGroup", fd);
  if (firstTry.ok) return firstTry;
  if (!isTelegramImageProcessFailed(firstTry.error)) return firstTry;

  const fd2 = new FormData();
  fd2.set("chat_id", chatId);
  const mediaDoc: Record<string, unknown>[] = [];
  let idx = 0;
  for (let i = 0; i < ready.length; i++) {
    const item = ready[i]!;
    if (item.kind === "url") {
      mediaDoc.push(
        i === 0 && captionHtml
          ? {
              type: "document",
              media: item.url,
              caption: captionHtml,
              parse_mode: "HTML",
            }
          : { type: "document", media: item.url }
      );
      continue;
    }
    const name = attachNames[idx]!;
    idx += 1;
    fd2.set(
      name,
      new File([new Uint8Array(item.data)], item.filename, {
        type: mimeForFilename(item.filename),
      })
    );
    mediaDoc.push(
      i === 0 && captionHtml
        ? {
            type: "document",
            media: `attach://${name}`,
            caption: captionHtml,
            parse_mode: "HTML",
          }
        : { type: "document", media: `attach://${name}` }
    );
  }
  fd2.set("media", JSON.stringify(mediaDoc));
  const second = await callTelegramFormData(botToken, "sendMediaGroup", fd2);
  if (second.ok) return second;
  return {
    ok: false,
    error: `${firstTry.error} Повтор всех как файлы: ${second.error}`,
  };
}
