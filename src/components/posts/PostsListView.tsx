import { toAbsoluteMediaSrc } from "@/lib/media-display";
import Link from "next/link";
import { PostClientReviewLink } from "@/components/posts/PostClientReviewLink";
import { PostListDeleteButton } from "@/components/posts/PostListDeleteButton";
import { PostListNotifyClientButton } from "@/components/posts/PostListNotifyClientButton";
import { formatTimeAgoRuFrom } from "@/components/posts/postReviewUtils";
import { publishScheduleInstantMs } from "@/domain/smm";
import {
  formatPublishScheduleLabelRu,
  publishScheduleToIsoString,
} from "@/lib/schedule-display";
import {
  discussionAuthorLabel,
  getLastDiscussionComment,
  POST_DRAFT_STATUS_LABELS,
  type ClientRecord,
  type PostDraftRecord,
  type PostDraftStatus,
} from "@/domain/smm";
import { POST_TYPE_OPTIONS } from "@/types/postType";

function postTypeLabel(value: PostDraftRecord["postType"]) {
  return POST_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function formatScheduled(date: string, time: string) {
  return formatPublishScheduleLabelRu(date, time);
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
    case "published":
      return `${base} bg-[color-mix(in_srgb,#5aab7a_22%,var(--surface-elevated))] text-[var(--foreground)] ring-1 ring-[color-mix(in_srgb,#5aab7a_45%,var(--border))]`;
    case "rejected":
      return `${base} bg-[color-mix(in_srgb,#c85858_20%,var(--surface-elevated))] text-[var(--foreground)] ring-1 ring-[color-mix(in_srgb,#c85858_50%,var(--border))]`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function PostsListView({
  rows,
  clients,
  siteOrigin,
  refMs,
  hasActiveFilters,
  emptyFilteredMessage,
  emptyNoFiltersMessage,
  showNotifyClientButton = false,
}: {
  rows: PostDraftRecord[];
  clients: ClientRecord[];
  siteOrigin: string | null;
  refMs: number;
  hasActiveFilters: boolean;
  emptyFilteredMessage: string;
  emptyNoFiltersMessage: string;
  /** «Уведомить клиента» (Telegram) — для списка актуальных постов. */
  showNotifyClientButton?: boolean;
}) {
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));

  return (
    <div className="min-w-0 space-y-4">
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-[14px] text-[var(--muted)]">
          {hasActiveFilters ? emptyFilteredMessage : emptyNoFiltersMessage}
        </p>
      ) : null}

      <ul
        className={`flex flex-col gap-4 ${rows.length === 0 ? "hidden" : ""}`}
      >
        {rows.map((post) => {
          const client = clientById[post.clientId];
          const thumb = post.imageUrls[0];
          const captionPreview =
            post.caption
              .split("\n")
              .find((l) => l.trim())
              ?.slice(0, 120) ?? "Без текста";
          const lastDiscussion = getLastDiscussionComment(post.discussion);
          const reviewPath = `/review/${encodeURIComponent(post.clientReviewToken)}`;
          const clientReviewCopyUrl = siteOrigin
            ? `${siteOrigin}${reviewPath}`
            : reviewPath;

          return (
            <li key={post.id}>
              <article className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:gap-5 sm:p-5">
                <div className="relative size-[72px] shrink-0 self-start overflow-hidden rounded-xl bg-[var(--surface-elevated)] sm:size-[88px] sm:self-auto">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toAbsoluteMediaSrc(thumb, siteOrigin || undefined)}
                      alt={post.altText || ""}
                      className="absolute inset-0 size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 w-full flex-1">
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
                      dateTime={publishScheduleToIsoString(
                        post.publishDate,
                        post.publishTime,
                      )}
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
                  <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
                    {lastDiscussion ? (
                      <div className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_85%,transparent)] px-3.5 py-3 sm:flex-1 sm:basis-0">
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
                              lastDiscussion.createdAt,
                            ).toISOString()}
                          >
                            {formatTimeAgoRuFrom(
                              lastDiscussion.createdAt,
                              refMs,
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
                          ? "w-full min-w-0 sm:flex-1 sm:basis-0"
                          : "w-full min-w-0"
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
                      href={`/posts/new?duplicateFrom=${encodeURIComponent(post.id)}`}
                      className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Дублировать пост
                    </Link>
                    <Link
                      href={`/posts/${post.id}/discussion`}
                      className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Обсуждения
                    </Link>
                    {showNotifyClientButton ? (
                      <>
                        <span
                          className="text-[13px] text-[var(--muted)]"
                          aria-hidden
                        >
                          ·
                        </span>
                        <PostListNotifyClientButton postId={post.id} />
                      </>
                    ) : null}
                    <span
                      className="text-[13px] text-[var(--muted)]"
                      aria-hidden
                    >
                      ·
                    </span>
                    <PostListDeleteButton postId={post.id} status={post.status} />
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Сортировка по дате/времени публикации (как на страницах списка постов). */
export function sortPostsByPublishSchedule(rows: PostDraftRecord[]) {
  return [...rows].sort(
    (a, b) =>
      publishScheduleInstantMs(a.publishDate, a.publishTime) -
      publishScheduleInstantMs(b.publishDate, b.publishTime),
  );
}
