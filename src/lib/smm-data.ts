import type {
  Activity as PrismaActivity,
  Client as PrismaClient,
  Post as PrismaPost,
  PostReviewComment as PrismaComment,
  PostContentType,
  PostDraftStatus as PrismaPostStatus,
} from "@prisma/client";
import { auth } from "@/auth";
import type {
  ActivityKind,
  ClientPlatform,
  ClientRecord,
  PostDraftRecord,
  PostDraftStatus,
  RecentActivityRecord,
} from "@/domain/smm";
import { prisma } from "@/lib/prisma";
import type { PostType } from "@/types/postType";

function spheresTuple(json: unknown): [string] | [string, string] {
  if (Array.isArray(json)) {
    const s = json.filter((x): x is string => typeof x === "string");
    if (s.length === 0) return ["—"];
    if (s.length === 1) return [s[0]];
    return [s[0], s[1]];
  }
  return ["—"];
}

function prismaStatusToDomain(s: PrismaPostStatus): PostDraftStatus {
  return s as PostDraftStatus;
}

function prismaPostTypeToDomain(t: PostContentType): PostType {
  return t as PostType;
}

export function toPostDraftRecord(
  row: PrismaPost & { discussion: PrismaComment[] }
): PostDraftRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    status: prismaStatusToDomain(row.status),
    postType: prismaPostTypeToDomain(row.postType),
    caption: row.caption,
    location: row.location,
    firstComment: row.firstComment,
    altText: row.altText,
    imageUrls: Array.isArray(row.imageUrls)
      ? (row.imageUrls as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    publishDate: row.publishDate,
    publishTime: row.publishTime,
    createdAt: row.createdAt.toISOString(),
    clientReviewToken: row.clientReviewToken,
    discussion:
      row.discussion.length > 0
        ? [...row.discussion]
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((c) => ({
              id: c.id,
              side: c.side === "self" ? "self" : "client",
              text: c.text,
              createdAt: c.createdAt.getTime(),
            }))
        : undefined,
  };
}

function enrichClientRecord(
  c: PrismaClient,
  posts: PostDraftRecord[],
  refMs: number
): ClientRecord {
  const mine = posts.filter((p) => p.clientId === c.id);
  const postsTotal = mine.length;
  const ref = new Date(refMs);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const postsThisMonth = mine.filter((p) => {
    const parts = p.publishDate.split("-").map(Number);
    const py = parts[0];
    const pm = parts[1];
    return py === y && pm === m + 1;
  }).length;
  const postsPendingReview = mine.filter((p) => p.status === "in_review").length;

  return {
    id: c.id,
    fullName: c.fullName,
    platform: c.platform as ClientPlatform,
    instagramUsername: c.instagramUsername,
    postsTotal,
    postsThisMonth,
    postsPendingReview,
    activitySpheres: spheresTuple(c.activitySpheres),
    contact: c.contact ?? undefined,
    instagramBusinessId: c.instagramBusinessId ?? undefined,
    facebookPageId: c.facebookPageId ?? undefined,
    businessAccountConfirmed: c.businessAccountConfirmed,
    telegramChatId: c.telegramChatId ?? undefined,
    hasTelegramBotToken: Boolean(c.telegramBotToken?.trim()),
  };
}

function toRecentActivityRecord(row: PrismaActivity): RecentActivityRecord {
  return {
    id: row.id,
    kind: row.kind as ActivityKind,
    createdAtMs: row.createdAt.getTime(),
    title: row.title,
    detail: row.detail ?? undefined,
    clientId: row.clientId ?? undefined,
    postId: row.postId ?? undefined,
  };
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    throw new Error("Unauthorized");
  }
  return id;
}

export async function listClientsForUser(
  userId: string,
  refMs: number
): Promise<ClientRecord[]> {
  const [clients, postRows] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { fullName: "asc" },
    }),
    prisma.post.findMany({
      where: { userId },
      include: { discussion: true },
    }),
  ]);
  const posts = postRows.map(toPostDraftRecord);
  return clients.map((c) => enrichClientRecord(c, posts, refMs));
}

export async function listPostsForUser(
  userId: string,
  filterClientId?: string
): Promise<PostDraftRecord[]> {
  const rows = await prisma.post.findMany({
    where: {
      userId,
      ...(filterClientId ? { clientId: filterClientId } : {}),
    },
    include: { discussion: true },
  });
  return rows.map(toPostDraftRecord);
}

export async function getPostForUser(
  userId: string,
  postId: string
): Promise<PostDraftRecord | null> {
  const row = await prisma.post.findFirst({
    where: { id: postId, userId },
    include: { discussion: true },
  });
  return row ? toPostDraftRecord(row) : null;
}

/** Публичная страница согласования: только по токену. */
export async function getPostByClientReviewToken(
  token: string
): Promise<PostDraftRecord | null> {
  const t = decodeURIComponent(token).trim();
  if (!t) return null;
  const row = await prisma.post.findFirst({
    where: { clientReviewToken: t },
    include: { discussion: true },
  });
  return row ? toPostDraftRecord(row) : null;
}

export async function getClientForUser(
  userId: string,
  clientId: string
): Promise<ClientRecord | null> {
  const row = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!row) return null;
  const posts = await listPostsForUser(userId);
  return enrichClientRecord(row, posts, Date.now());
}

/** Карточка клиента по id (для публичной страницы согласования по токену поста). */
export async function getClientRecordById(
  clientId: string
): Promise<ClientRecord | null> {
  const row = await prisma.client.findUnique({ where: { id: clientId } });
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    platform: row.platform as ClientPlatform,
    instagramUsername: row.instagramUsername,
    postsTotal: 0,
    postsThisMonth: 0,
    postsPendingReview: 0,
    activitySpheres: spheresTuple(row.activitySpheres),
    telegramChatId: row.telegramChatId ?? undefined,
    hasTelegramBotToken: Boolean(row.telegramBotToken?.trim()),
  };
}

export async function listActivitiesForUser(
  userId: string,
  limit: number,
  refMs: number
): Promise<RecentActivityRecord[]> {
  const rows = await prisma.activity.findMany({
    where: { userId, createdAt: { lte: new Date(refMs) } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toRecentActivityRecord);
}
