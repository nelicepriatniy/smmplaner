import {
  POST_DRAFT_STATUS_LABELS,
  type ClientPlatform,
  type PostDraftStatus,
} from "@/domain/smm";

const PLATFORMS: readonly ClientPlatform[] = [
  "instagram",
  "facebook",
  "telegram",
  "vk",
];

const ALL_STATUSES: PostDraftStatus[] = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "rejected",
];

function rawToString(raw: string | string[] | undefined): string {
  if (raw === undefined) return "";
  return Array.isArray(raw) ? raw.join(",") : raw;
}

/** Значения из `?platform=instagram,vk` (пусто = без фильтра по платформе). */
export function parsePlatformsFromSearchParam(
  raw: string | string[] | undefined
): ClientPlatform[] {
  const s = rawToString(raw).trim();
  if (!s) return [];
  const allowed = new Set<string>(PLATFORMS);
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is ClientPlatform => allowed.has(x));
}

/** ID из `?client=id1,id2` (пусто = все клиенты). */
export function parseClientIdsFromSearchParam(
  raw: string | string[] | undefined,
  validIds: Set<string>
): string[] {
  const s = rawToString(raw).trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((id) => validIds.has(id));
}

/** Значения из `?status=draft,scheduled` (пусто = все статусы). */
export function parseStatusesFromSearchParam(
  raw: string | string[] | undefined
): PostDraftStatus[] {
  const s = rawToString(raw).trim();
  if (!s) return [];
  const keys = ALL_STATUSES as readonly string[];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is PostDraftStatus => keys.includes(x));
}

export const CALENDAR_PLATFORM_OPTIONS: readonly {
  id: ClientPlatform;
  label: string;
}[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" },
  { id: "vk", label: "ВКонтакте" },
];

export const CALENDAR_STATUS_OPTIONS: readonly {
  id: PostDraftStatus;
  label: string;
}[] = ALL_STATUSES.map((id) => ({
  id,
  label: POST_DRAFT_STATUS_LABELS[id],
}));
