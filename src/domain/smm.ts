import type { PostReviewComment } from "@/components/posts/postReviewTypes";
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

export type ClientRecord = {
  id: string;
  fullName: string;
  instagramUsername: string;
  postsTotal: number;
  postsThisMonth: number;
  postsPendingReview: number;
  activitySpheres: [string] | [string, string];
  /** Поля формы редактирования; токен страницы в клиент не передаём. */
  contact?: string | null;
  instagramBusinessId?: string | null;
  facebookPageId?: string | null;
  businessAccountConfirmed?: boolean;
};

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
  clientId: string;
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
  "id" | "createdAt" | "status" | "discussion" | "clientReviewToken"
>;

export function postDraftToEditorInitial(
  draft: PostDraftRecord
): PostEditorInitialValues {
  return {
    clientId: draft.clientId,
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

export function scheduledPublishMs(post: PostDraftRecord): number {
  const t =
    post.publishTime.length === 5 ? `${post.publishTime}:00` : post.publishTime;
  return Date.parse(`${post.publishDate}T${t}+03:00`);
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
/** Месяц календаря по умолчанию: по последней дате публикации среди постов или текущий месяц. */
export function calendarAnchorFromPosts(
  posts: PostDraftRecord[]
): { year: number; monthIndex: number } {
  if (!posts.length) {
    const d = new Date();
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
  }
  let best = posts[0].publishDate;
  for (const p of posts) {
    if (p.publishDate > best) best = p.publishDate;
  }
  const parts = best.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  if (!y || !m) {
    const d = new Date();
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
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
