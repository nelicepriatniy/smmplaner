import dns from "node:dns";
import { readFile } from "fs/promises";
import { basename, join } from "path";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const VK_API_VERSION = "5.199";
const VK_MAX_ATTACHMENTS = 10;
/** Текст записи на стене (ограничение API, с запасом). */
const VK_MESSAGE_MAX = 16_000;

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
  return "application/octet-stream";
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
      out.push({ kind: "file", data: buf, filename: r.filename });
    } catch (e) {
      console.warn("[vk] пропуск изображения (файл не прочитан):", r.filename, e);
    }
  }
  return out;
}

type VkApiError = { error_msg: string; error_code?: number };

function formatVkApiError(err: VkApiError): string {
  const code = err.error_code;
  if (code === 27) {
    return (
      "Загрузка фото и часть методов стены недоступны с токеном сообщества (ключ доступа группы). " +
      "Для постов с картинками укажите пользовательский access token администратора (OAuth приложения) " +
      "со scope «photos» и «wall» — им же будет вызываться wall.post на стену группы. " +
      "Только текст без изображений можно пробовать с ключом сообщества, если ВК это разрешит для wall.post."
    );
  }
  if (code === 15) {
    return (
      "У токена нет прав на этот метод API (ош. 15). Часто так бывает, если через VK ID выдан только базовый доступ (профиль), " +
      "а для публикации на стене и фото нужны права API ВКонтакте: как минимум «wall» и «photos» (иногда «groups»). " +
      "В кабинете приложения VK ID (id.vk.ru → ваше приложение → «Доступы») включите нужные доступы к API и заново войдите через кнопку на сайте; " +
      "в .env можно задать NEXT_PUBLIC_VK_SCOPE=wall,photos,groups,offline. Если в кабинете нет нужных пунктов — см. документацию VK ID или поддержку. " +
      "Либо вставьте вручную пользовательский токен из классической авторизации приложения VK с нужными scope."
    );
  }
  const suffix = code != null ? ` [${code}]` : "";
  return `${err.error_msg}${suffix}`;
}

async function vkMethod<T>(
  method: string,
  params: Record<string, string | number | undefined>,
  accessToken: string
): Promise<{ ok: true; response: T } | { ok: false; error: string }> {
  const formBody = new URLSearchParams();
  formBody.set("access_token", accessToken);
  formBody.set("v", VK_API_VERSION);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    formBody.set(k, String(v));
  }
  let res: Response;
  try {
    res = await fetch(`https://api.vk.com/method/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
  } catch (e) {
    console.error("[vk] fetch api.vk.com failed", e);
    return {
      ok: false,
      error: `Нет связи с api.vk.com (${describeFetchFailure(e)}).`,
    };
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: `ВК: ответ не JSON (HTTP ${res.status}).` };
  }
  const body = json as { response?: T; error?: VkApiError };
  if (body.error) {
    return { ok: false, error: formatVkApiError(body.error) };
  }
  if (body.response === undefined) {
    return { ok: false, error: "ВК: пустой ответ API." };
  }
  return { ok: true, response: body.response };
}

type WallUploadServer = { upload_url: string };

type SaveWallPhotoItem = {
  id: number;
  owner_id: number;
};

async function readyPhotoToBuffer(photo: ReadyPhoto): Promise<Buffer | null> {
  if (photo.kind === "file") return photo.data;
  try {
    const res = await fetch(photo.url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

/**
 * Загружает фото на стену (photos.getWallUploadServer → POST → saveWallPhoto),
 * возвращает строку вложения вида photo{owner_id}_{id}.
 */
async function uploadOneWallPhoto(input: {
  accessToken: string;
  /** Положительный id сообщества; для личной стены — undefined. */
  groupIdPositive: number | undefined;
  photo: ReadyPhoto;
}): Promise<{ ok: true; attachment: string } | { ok: false; error: string }> {
  const srv = await vkMethod<WallUploadServer>(
    "photos.getWallUploadServer",
    input.groupIdPositive != null
      ? { group_id: input.groupIdPositive }
      : {},
    input.accessToken
  );
  if (!srv.ok) return srv;

  const buf = await readyPhotoToBuffer(input.photo);
  if (!buf?.length) {
    return { ok: false, error: "Не удалось получить данные изображения для ВК." };
  }

  const fd = new FormData();
  const mime = mimeForFilename(
    input.photo.kind === "file" ? input.photo.filename : "image.jpg"
  );
  const name =
    input.photo.kind === "file" ? input.photo.filename : "photo.jpg";
  fd.set(
    "photo",
    new File([new Uint8Array(buf)], name, {
      type: mime,
    })
  );

  let uploadRes: Response;
  try {
    uploadRes = await fetch(srv.response.upload_url, { method: "POST", body: fd });
  } catch (e) {
    return {
      ok: false,
      error: `Загрузка файла на сервер ВК не удалась (${describeFetchFailure(e)}).`,
    };
  }

  const uploadText = await uploadRes.text();
  let uploadJson: {
    server?: string | number;
    photo?: string;
    hash?: string;
  };
  try {
    uploadJson = JSON.parse(uploadText) as typeof uploadJson;
  } catch {
    return {
      ok: false,
      error: `ВК upload: ожидался JSON, получено: ${uploadText.slice(0, 120)}…`,
    };
  }
  if (
    uploadJson.server === undefined ||
    uploadJson.photo === undefined ||
    uploadJson.hash === undefined
  ) {
    return {
      ok: false,
      error: `ВК upload: нет полей server/photo/hash в ответе.`,
    };
  }

  const save = await vkMethod<SaveWallPhotoItem[]>(
    "photos.saveWallPhoto",
    {
      group_id: input.groupIdPositive,
      server: uploadJson.server,
      photo: uploadJson.photo,
      hash: uploadJson.hash,
    },
    input.accessToken
  );
  if (!save.ok) return save;
  const first = save.response[0];
  if (!first?.id || first.owner_id === undefined) {
    return { ok: false, error: "ВК: photos.saveWallPhoto не вернул фото." };
  }
  return {
    ok: true,
    attachment: `photo${first.owner_id}_${first.id}`,
  };
}

function clipMessage(text: string): string {
  const t = text.trim();
  if (t.length <= VK_MESSAGE_MAX) return t;
  return `${t.slice(0, VK_MESSAGE_MAX - 1)}…`;
}

/**
 * Публикует запись на стене через wall.post (текст и до 10 фото).
 * Локальные пути `/uploads/posts/…` читаются с диска; для https-URL без диска нужен публичный APP_BASE_URL.
 */
export async function sendPostToVkWall(input: {
  accessToken: string;
  /** Как в БД: отрицательный — группа, положительный — пользователь. */
  ownerIdStr: string;
  fromGroup: boolean;
  message: string;
  imageUrls: string[];
  appBaseUrl: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerId = Number.parseInt(input.ownerIdStr.trim(), 10);
  if (Number.isNaN(ownerId) || ownerId === 0) {
    return { ok: false, error: "Некорректный owner_id стены ВКонтакте." };
  }

  const msg = clipMessage(input.message);
  const groupIdPositive = ownerId < 0 ? Math.abs(ownerId) : undefined;

  const resolved = input.imageUrls
    .map((x) => resolvePhoto(x, input.appBaseUrl))
    .filter((x): x is ResolvedPhoto => Boolean(x));
  const ready = (await materializeResolvedPhotos(resolved)).slice(
    0,
    VK_MAX_ATTACHMENTS
  );

  const attachments: string[] = [];
  for (const photo of ready) {
    const up = await uploadOneWallPhoto({
      accessToken: input.accessToken,
      groupIdPositive,
      photo,
    });
    if (!up.ok) return up;
    attachments.push(up.attachment);
  }

  if (!msg && attachments.length === 0) {
    return { ok: false, error: "Нет текста и изображений для публикации во ВК." };
  }

  const wallParams: Record<string, string | number | undefined> = {
    owner_id: ownerId,
    message: msg || undefined,
    attachments:
      attachments.length > 0 ? attachments.join(",") : undefined,
  };
  if (ownerId < 0) {
    wallParams.from_group = input.fromGroup ? 1 : 0;
  }

  const post = await vkMethod<number>("wall.post", wallParams, input.accessToken);
  if (!post.ok) return post;
  return { ok: true };
}
