import type { PostReviewComment } from "@/components/posts/postReviewTypes";
import type { TelegramChatTarget } from "@/lib/telegram-targets";
import {
  labelsForSelectedTargets,
  normalizeAccountTelegramChats,
} from "@/lib/telegram-targets";
import type { PostType } from "@/types/postType";

export const H_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Опорное «сейчас» для демо-обсуждений в сиде (стабильные «N ч назад» при SSR).
 * В приложении передавайте `Date.now()` как `refMs`.
 */
export const MOCK_DISCUSSION_REF_MS = Date.parse(
  "2026-04-24T15:00:00+03:00"
);

/** Имя SMM в переписке (как в сайдбаре). */
export const MOCK_SMM_FIRST_NAME = "Аня";

export function discussionAuthorLabel(side: PostReviewComment["side"]): string {
  return side === "self" ? `${MOCK_SMM_FIRST_NAME} (вы)` : "Клиент";
}

export function getLastDiscussionComment(
  discussion: PostReviewComment[] | undefined
): PostReviewComment | undefined {
  if (!discussion?.length) return undefined;
  return [...discussion].sort((a, b) => a.createdAt - b.createdAt).at(-1);
}

export type ClientPlatform = "instagram" | "facebook" | "telegram" | "vk";

/** Все платформы, которые можно подключить к клиенту (порядок на карточке). */
export const ALL_CLIENT_PLATFORMS: readonly ClientPlatform[] = [
  "instagram",
  "facebook",
  "telegram",
  "vk",
];

/** Подключённая соцсеть (учётка для публикации). */
export type ClientSocialAccountRecord = {
  id: string;
  clientId: string;
  platform: ClientPlatform;
  instagramUsername: string;
  instagramBusinessId?: string | null;
  facebookPageId?: string | null;
  businessAccountConfirmed?: boolean;
  telegramChatId?: string | null;
  /** Несколько чатов с подписью; пустой массив — только legacy `telegramChatId`. */
  telegramChats?: TelegramChatTarget[];
  hasTelegramBotToken?: boolean;
  vkOwnerId?: string | null;
  vkFromGroup?: boolean;
  hasVkAccessToken?: boolean;
  /** Сохранённый Page access token (Instagram / Facebook). */
  hasPageAccessToken?: boolean;
};

export type ClientRecord = {
  id: string;
  fullName: string;
  socialAccounts: ClientSocialAccountRecord[];
  postsTotal: number;
  postsThisMonth: number;
  /** Посты со статусом `scheduled`. */
  postsScheduled: number;
  postsPendingReview: number;
  activitySpheres: [string] | [string, string];
  contact?: string | null;
  /** Внутренние заметки о клиенте. */
  notes?: string | null;
};

/** Краткое имя площадки для списков и иконок. */
export function clientPlatformName(platform: ClientPlatform): string {
  if (platform === "instagram") return "Instagram";
  if (platform === "facebook") return "Facebook";
  if (platform === "vk") return "ВКонтакте";
  return "Telegram";
}

/** Метка аккаунта без имени клиента (селект «соцсеть»). */
export function socialAccountShortLabel(account: ClientSocialAccountRecord): string {
  if (account.platform === "telegram") {
    const targets = normalizeAccountTelegramChats(
      account.telegramChats,
      account.telegramChatId
    );
    if (targets.length === 0) return "Telegram";
    const names = targets.map((t) => (t.name.trim() ? t.name : t.chatId)).join(", ");
    const short = names.length > 48 ? `${names.slice(0, 45)}…` : names;
    return `Telegram · ${short}`;
  }
  if (account.platform === "vk") {
    const wall = account.vkOwnerId?.trim();
    return wall ? `ВКонтакте · ${wall}` : "ВКонтакте";
  }
  if (account.platform === "facebook") {
    const slug = account.instagramUsername.trim();
    const pid = account.facebookPageId?.trim();
    if (slug && pid) return `Facebook · ${slug} (id ${pid})`;
    if (pid) return `Facebook · страница ${pid}`;
    return "Facebook";
  }
  const ig = account.instagramUsername.trim();
  return ig ? `Instagram · @${ig}` : "Instagram";
}

/** Подпись в селектах: клиент + аккаунт. */
export function clientSocialSelectLabel(
  client: ClientRecord,
  account: ClientSocialAccountRecord
): string {
  return `${client.fullName} — ${socialAccountShortLabel(account)}`;
}

/** @deprecated Используйте clientSocialSelectLabel / socialAccountShortLabel */
export function clientSelectLabel(client: ClientRecord): string {
  const a = client.socialAccounts[0];
  if (!a) return client.fullName;
  return clientSocialSelectLabel(client, a);
}

/** Короткая метка в ячейке календаря для поста. */
export function postCalendarShortHandle(
  post: PostDraftRecord,
  clients: ClientRecord[]
): string {
  const client = clients.find((c) => c.id === post.clientId);
  const acc =
    client?.socialAccounts.find((s) => s.id === post.socialAccountId) ??
    client?.socialAccounts[0];
  if (!acc) return post.clientId.slice(0, 8);
  if (acc.platform === "telegram") {
    const targets = normalizeAccountTelegramChats(acc.telegramChats, acc.telegramChatId);
    if (targets.length === 0) return "TG";
    const names = targets.map((t) => t.name.trim() || t.chatId).join(", ");
    return names.length > 40 ? `${names.slice(0, 37)}…` : names;
  }
  if (acc.platform === "vk") return acc.vkOwnerId?.trim() || "VK";
  if (acc.platform === "facebook")
    return acc.instagramUsername.trim() || acc.facebookPageId?.trim() || "FB";
  return acc.instagramUsername.trim() || "IG";
}

/** Данные для предпросмотра поста в редакторе / портале. */
export type PostPublisherPreview = {
  fullName: string;
  platform: ClientPlatform;
  instagramUsername: string;
  telegramChatId?: string | null;
  /** Подзаголовок в превью Telegram: выбранные чаты или список целей. */
  telegramSubtitle?: string | null;
  vkOwnerId?: string | null;
};

export function toPostPublisherPreview(
  client: ClientRecord | null,
  account: ClientSocialAccountRecord | null,
  telegramChatTargetIds?: string[] | null
): PostPublisherPreview | null {
  if (!client || !account) return null;
  const targets =
    account.platform === "telegram"
      ? normalizeAccountTelegramChats(account.telegramChats, account.telegramChatId)
      : [];
  const sel = telegramChatTargetIds?.filter(Boolean) ?? [];
  const telegramSubtitle =
    account.platform === "telegram"
      ? sel.length > 0
        ? labelsForSelectedTargets(targets, sel) ||
          account.telegramChatId?.trim() ||
          null
        : targets.map((t) => t.name.trim() || t.chatId).join(", ") || null
      : null;
  return {
    fullName: client.fullName,
    platform: account.platform,
    instagramUsername: account.instagramUsername,
    telegramChatId: account.telegramChatId,
    telegramSubtitle,
    vkOwnerId: account.vkOwnerId,
  };
}

/** Имя в превью поста (строка перед текстом подписи). */
export function postPreviewAuthorUsername(preview: PostPublisherPreview | null): string {
  if (!preview) return "client";
  if (preview.platform === "telegram" || preview.platform === "vk") {
    const name = preview.fullName.trim();
    if (name.length <= 24) return name;
    return `${name.slice(0, 21)}…`;
  }
  return preview.instagramUsername.trim() || preview.fullName;
}

/** Короткая метка в ячейке календаря (без @) — по клиенту и аккаунту. */
export function clientCalendarShortHandle(
  client: ClientRecord | undefined,
  account: ClientSocialAccountRecord | undefined,
  fallbackId: string
): string {
  if (!client) return fallbackId;
  const acc = account ?? client.socialAccounts[0];
  if (!acc) return fallbackId;
  if (acc.platform === "telegram") {
    const targets = normalizeAccountTelegramChats(acc.telegramChats, acc.telegramChatId);
    if (targets.length === 0) return "TG";
    const names = targets.map((t) => t.name.trim() || t.chatId).join(", ");
    return names.length > 40 ? `${names.slice(0, 37)}…` : names;
  }
  if (acc.platform === "vk") return acc.vkOwnerId?.trim() || "VK";
  if (acc.platform === "facebook")
    return acc.instagramUsername.trim() || acc.facebookPageId?.trim() || "FB";
  return acc.instagramUsername.trim() || "IG";
}

export type PostDraftStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "rejected";

export const POST_DRAFT_STATUS_LABELS: Record<PostDraftStatus, string> = {
  draft: "Черновик",
  in_review: "На рассмотрении",
  scheduled: "Ждёт публикации",
  published: "Опубликован",
  rejected: "Отклонён",
};

export type PostDraftRecord = {
  id: string;
  /** Владелец поста (клиент). */
  clientId: string;
  /** Выбранная соцсеть публикации. */
  socialAccountId: string;
  /** Id целей из `telegramChats` аккаунта (только Telegram). */
  telegramChatTargetIds: string[];
  socialAccount: ClientSocialAccountRecord;
  status: PostDraftStatus;
  postType: PostType;
  caption: string;
  location: string;
  firstComment: string;
  altText: string;
  imageUrls: string[];
  publishDate: string;
  publishTime: string;
  createdAt: string;
  discussion?: PostReviewComment[];
  clientReviewToken: string;
};

export type PostEditorInitialValues = Omit<
  PostDraftRecord,
  "id" | "createdAt" | "status" | "discussion" | "clientReviewToken" | "socialAccount"
>;

export function postDraftToEditorInitial(
  draft: PostDraftRecord
): PostEditorInitialValues {
  return {
    clientId: draft.clientId,
    socialAccountId: draft.socialAccountId,
    telegramChatTargetIds: draft.telegramChatTargetIds,
    postType: draft.postType,
    caption: draft.caption,
    location: draft.location,
    firstComment: draft.firstComment,
    altText: draft.altText,
    imageUrls: draft.imageUrls,
    publishDate: draft.publishDate,
    publishTime: draft.publishTime,
  };
}

/**
 * Часовой пояс плановой даты/времени в БД, cron публикации и полей ввода в редакторе.
 * Календарная дата и «настенные» часы — как в Москве (без перевода на летнее время).
 */
export const PUBLISH_SCHEDULE_TZ = "Europe/Moscow" as const;
const PUBLISH_SCHEDULE_OFFSET = "+03:00" as const;

/** Момент публикации по строкам даты/времени из редактора. */
export function publishScheduleInstantMs(
  publishDate: string,
  publishTime: string
): number {
  const t =
    publishTime.length === 5 ? `${publishTime}:00` : publishTime;
  return Date.parse(`${publishDate}T${t}${PUBLISH_SCHEDULE_OFFSET}`);
}

export function scheduledPublishMs(post: PostDraftRecord): number {
  return publishScheduleInstantMs(post.publishDate, post.publishTime);
}

export function countScheduledPostsInNextDays(
  posts: PostDraftRecord[],
  days: number,
  refMs: number
): number {
  const end = refMs + days * DAY_MS;
  return posts.filter(
    (p) =>
      p.status === "scheduled" &&
      scheduledPublishMs(p) >= refMs &&
      scheduledPublishMs(p) <= end
  ).length;
}

export function getUpcomingScheduledPosts(
  posts: PostDraftRecord[],
  limit: number,
  refMs: number
): PostDraftRecord[] {
  return [...posts]
    .filter((p) => p.status === "scheduled" && scheduledPublishMs(p) >= refMs)
    .sort((a, b) => scheduledPublishMs(a) - scheduledPublishMs(b))
    .slice(0, limit);
}

export type ActivityKind =
  | "client_comment"
  | "client_approval"
  | "client_rejection"
  | "post_published"
  | "client_added"
  | "post_scheduled";

export type RecentActivityRecord = {
  id: string;
  kind: ActivityKind;
  createdAtMs: number;
  title: string;
  detail?: string;
  clientId?: string;
  postId?: string;
};

export function getRecentActivities(
  activities: RecentActivityRecord[],
  limit: number,
  refMs: number
): RecentActivityRecord[] {
  return [...activities]
    .filter((a) => a.createdAtMs <= refMs)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, limit);
}

export type DashboardStat = {
  id: "total" | "review" | "scheduled" | "clients";
  label: string;
  value: number;
  hint: string;
};

function ruAccountsHint(count: number): string {
  if (count === 1) return "На 1 аккаунте";
  return `На ${count} аккаунтах`;
}

/** Агрегаты дашборда по реальным постам и клиентам. */
/**
 * Месяц календаря по умолчанию.
 * Если в **текущем календарном месяце** есть хотя бы один пост — показываем этот месяц
 * (чтобы пост «на сегодня» не терялся, когда в базе есть планы на более поздние месяцы).
 * Иначе — месяц самой поздней `publishDate` среди постов; без постов — текущий месяц.
 */
export function calendarAnchorFromPosts(
  posts: PostDraftRecord[]
): { year: number; monthIndex: number } {
  const d = new Date();
  const nowYear = d.getFullYear();
  const nowMonthIndex = d.getMonth();
  if (!posts.length) {
    return { year: nowYear, monthIndex: nowMonthIndex };
  }

  const yyyymm = `${nowYear}-${String(nowMonthIndex + 1).padStart(2, "0")}`;
  const anyInThisCalendarMonth = posts.some((p) => p.publishDate.startsWith(yyyymm));
  if (anyInThisCalendarMonth) {
    return { year: nowYear, monthIndex: nowMonthIndex };
  }

  let best = posts[0].publishDate;
  for (const p of posts) {
    if (p.publishDate > best) best = p.publishDate;
  }
  const parts = best.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  if (!y || !m) {
    return { year: nowYear, monthIndex: nowMonthIndex };
  }
  return { year: y, monthIndex: m - 1 };
}

export function computeDashboardStats(
  clients: ClientRecord[],
  posts: PostDraftRecord[],
  refMs: number
): DashboardStat[] {
  const totalPosts = posts.length;
  const weekMs = 7 * DAY_MS;
  const weekStart = refMs - weekMs;
  const postsCreatedThisWeek = posts.filter((p) => {
    const t = Date.parse(p.createdAt);
    return !Number.isNaN(t) && t >= weekStart && t <= refMs;
  }).length;
  const inReview = posts.filter((p) => p.status === "in_review").length;
  const activeClients = clients.length;
  const scheduledNext30 = countScheduledPostsInNextDays(posts, 30, refMs);

  return [
    {
      id: "total",
      label: "Всего постов",
      value: totalPosts,
      hint: `+${postsCreatedThisWeek} за неделю`,
    },
    {
      id: "review",
      label: "На рассмотрении",
      value: inReview,
      hint: "Ждут согласования клиента",
    },
    {
      id: "scheduled",
      label: "В расписании",
      value: scheduledNext30,
      hint: "В ближайшие 30 дней",
    },
    {
      id: "clients",
      label: "Активные клиенты",
      value: activeClients,
      hint: ruAccountsHint(activeClients),
    },
  ];
}
