import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PostClientReviewLink } from "@/components/posts/PostClientReviewLink";
import { formatTimeAgoRuFrom } from "@/components/posts/postReviewUtils";
import { PostsClientFilter } from "@/components/posts/PostsClientFilter";
import {
  discussionAuthorLabel,
  getLastDiscussionComment,
  mockClients,
  mockPostDrafts,
  MOCK_DISCUSSION_REF_MS,
  POST_DRAFT_STATUS_LABELS,
  type PostDraftStatus,
} from "@/data/mockDb";
import { POST_TYPE_OPTIONS } from "@/types/postType";

export const metadata: Metadata = {
  title: "Актуальные посты — smmplaner",
  description: "Запланированные и недавно созданные посты",
};

function postTypeLabel(value: (typeof mockPostDrafts)[number]["postType"]) {
  return POST_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function scheduledAtIso(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

function formatScheduled(date: string, time: string) {
  const d = new Date(scheduledAtIso(date, time));
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusBadgeClass(status: PostDraftStatus) {
  const base =
    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide";
  switch (status) {
    case "draft":
      return `${base} bg-[var(--surface-elevated)] text-[var(--muted)] ring-1 ring-[var(--border)]`;
    case "in_review":
      return `${base} bg-[var(--accent-soft)] text-[var(--foreground)] ring-1 ring-[color-mix(in_srgb,var(--accent)_40%,var(--border))]`;
    case "scheduled":
      return `${base} bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface-elevated))] text-[var(--foreground)] ring-1 ring-[var(--accent-soft)]`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

type PageProps = {
  searchParams: Promise<{ client?: string }>;
};

export default async function CurrentPostsPage({ searchParams }: PageProps) {
  const { client: clientParam } = await searchParams;
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const siteOrigin = host ? `${proto}://${host}` : "";

  const clientById = Object.fromEntries(mockClients.map((c) => [c.id, c]));

  const filterClientId =
    typeof clientParam === "string" &&
    mockClients.some((c) => c.id === clientParam)
      ? clientParam
      : undefined;

  const rows = [...mockPostDrafts]
    .filter((p) =>
      filterClientId ? p.clientId === filterClientId : true
    )
    .sort(
      (a, b) =>
        new Date(scheduledAtIso(a.publishDate, a.publishTime)).getTime() -
        new Date(scheduledAtIso(b.publishDate, b.publishTime)).getTime(),
    );

  const filterOptions = mockClients.map((c) => ({
    id: c.id,
    label: `${c.fullName} (@${c.instagramUsername})`,
  }));

  return (
    <main className="w-full py-10 sm:py-12">
      <header className="mb-2 sm:mb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Актуальные посты
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Черновики и запланированные публикации из демо-данных (как из БД).
        </p>
      </header>

      <Suspense
        fallback={
          <div className="mb-8 h-[76px] max-w-md animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        }
      >
        <PostsClientFilter clients={filterOptions} />
      </Suspense>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-[14px] text-[var(--muted)]">
          {filterClientId
            ? "У выбранного пользователя пока нет постов в этом списке."
            : "Постов пока нет."}
        </p>
      ) : null}

      <ul className={`flex flex-col gap-4 ${rows.length === 0 ? "hidden" : ""}`}>
        {rows.map((post) => {
          const client = clientById[post.clientId];
          const thumb = post.imageUrls[0];
          const captionPreview =
            post.caption.split("\n").find((l) => l.trim())?.slice(0, 120) ??
            "Без текста";
          const lastDiscussion = getLastDiscussionComment(post.discussion);
          const reviewPath = `/review/${encodeURIComponent(post.clientReviewToken)}`;
          const clientReviewCopyUrl = siteOrigin
            ? `${siteOrigin}${reviewPath}`
            : reviewPath;

          return (
            <li key={post.id}>
              <article className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:gap-5 sm:p-5">
                <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-[var(--surface-elevated)] sm:size-[88px]">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={post.altText || ""}
                      fill
                      className="object-cover"
                      sizes="88px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span
                      className={statusBadgeClass(post.status)}
                      title="Статус поста"
                    >
                      {POST_DRAFT_STATUS_LABELS[post.status]}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--accent)]">
                      {postTypeLabel(post.postType)}
                    </span>
                    <span className="text-[13px] text-[var(--muted)]">·</span>
                    <time
                      className="text-[13px] tabular-nums text-[var(--muted)]"
                      dateTime={scheduledAtIso(post.publishDate, post.publishTime)}
                    >
                      {formatScheduled(post.publishDate, post.publishTime)}
                    </time>
                  </div>
                  {client ? (
                    <p className="mt-1 truncate text-[15px] font-semibold text-[var(--foreground)]">
                      {client.fullName}
                    </p>
                  ) : (
                    <p className="mt-1 text-[15px] text-[var(--muted)]">
                      Клиент не найден ({post.clientId})
                    </p>
                  )}
                  <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--muted)]">
                    {captionPreview}
                    {post.caption.length > captionPreview.length ? "…" : ""}
                  </p>
                  <div className="mt-4 flex flex-row flex-wrap items-stretch gap-3">
                    {lastDiscussion ? (
                      <div className="min-w-0 flex-1 basis-0 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_85%,transparent)] px-3.5 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Комментарии
                        </p>
                        <p className="mt-2 text-[12px] text-[var(--muted)]">
                          <span className="font-medium text-[var(--foreground)]">
                            {discussionAuthorLabel(lastDiscussion.side)}
                          </span>
                          <span aria-hidden> · </span>
                          <time
                            dateTime={new Date(
                              lastDiscussion.createdAt
                            ).toISOString()}
                          >
                            {formatTimeAgoRuFrom(
                              lastDiscussion.createdAt,
                              MOCK_DISCUSSION_REF_MS
                            )}
                          </time>
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[var(--foreground)]">
                          {lastDiscussion.text}
                        </p>
                      </div>
                    ) : null}
                    <PostClientReviewLink
                      copyUrl={clientReviewCopyUrl}
                      openPath={reviewPath}
                      className={
                        lastDiscussion
                          ? "min-w-0 flex-1 basis-0"
                          : "min-w-0 w-full"
                      }
                    />
                  </div>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Редактировать
                    </Link>
                    <Link
                      href={`/posts/${post.id}/discussion`}
                      className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Обсуждения
                    </Link>
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
