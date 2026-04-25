import { toAbsoluteMediaSrc } from "@/lib/media-display";
import Link from "next/link";
import {
  POST_DRAFT_STATUS_LABELS,
  clientSocialSelectLabel,
  type ClientRecord,
  type PostDraftRecord,
  type PostDraftStatus,
} from "@/domain/smm";
import { POST_TYPE_OPTIONS } from "@/types/postType";

/** Карточка «скоро в публикации» — тот же визуальный язык, что у `post_scheduled` в недавней активности. */
const UPCOMING_CARD_SHELL =
  "rounded-xl border border-[var(--border)] py-3.5 pl-3.5 pr-3.5 sm:pl-4 sm:pr-4 border-l-[3px] border-[color-mix(in_srgb,#94a3b8_68%,var(--border))] bg-[color-mix(in_srgb,#94a3b8_8%,var(--surface))]";

const CARD_INTERACTIVE =
  "block transition-opacity hover:opacity-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

/** Текст на цветных плашках: в светлой теме почти чёрный, в тёмной — прежняя смесь. */
const BADGE_TEXT_LIGHT = "text-[#141414]";

function statusBadgeClass(status: PostDraftStatus) {
  const base =
    "inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]";
  switch (status) {
    case "draft":
      return `${base} bg-[var(--surface-elevated)] ${BADGE_TEXT_LIGHT} ring-1 ring-[var(--border)] dark:text-[var(--muted)]`;
    case "in_review":
      return `${base} bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] ${BADGE_TEXT_LIGHT} ring-1 ring-[color-mix(in_srgb,var(--accent)_40%,var(--border))] dark:text-[var(--foreground)]`;
    case "scheduled":
      return `${base} bg-[color-mix(in_srgb,#94a3b8_14%,transparent)] ${BADGE_TEXT_LIGHT} dark:text-[color-mix(in_srgb,#e2e8f0_88%,#475569)]`;
    case "published":
      return `${base} bg-[color-mix(in_srgb,#34d399_18%,transparent)] ${BADGE_TEXT_LIGHT} dark:text-[color-mix(in_srgb,#a7f3d0_95%,#047857)]`;
    case "rejected":
      return `${base} bg-[color-mix(in_srgb,#fb7185_14%,transparent)] ${BADGE_TEXT_LIGHT} dark:text-[color-mix(in_srgb,#fecdd3_92%,#9f1239)]`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function scheduledAtIso(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

function formatScheduledRu(date: string, time: string) {
  const d = new Date(scheduledAtIso(date, time));
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function postTypeLabel(value: PostDraftRecord["postType"]) {
  return POST_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function DashboardUpcomingPosts({
  posts,
  clients,
  mediaOrigin,
}: {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
  /** Origin запроса — чтобы миниатюры /uploads/… грузились как абсолютные URL. */
  mediaOrigin?: string;
}) {
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-labelledby="dash-upcoming-heading"
    >
      <div className="mb-4 flex flex-shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="dash-upcoming-heading"
            className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]"
          >
            Скоро в публикации
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">
            Запланированные слоты, ближайшие по времени
          </p>
        </div>
        <Link
          href="/posts/current"
          className="shrink-0 text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Все актуальные
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-[14px] text-[var(--muted)]">
          Нет запланированных постов после текущей отметки времени.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2.5">
          {posts.map((post) => {
            const client = clientById[post.clientId];
            const socialAcc = client?.socialAccounts.find(
              (s) => s.id === post.socialAccountId
            );
            const thumb = post.imageUrls[0];
            const captionPreview =
              post.caption.split("\n").find((l) => l.trim())?.slice(0, 100) ??
              "Без текста";
            const editHref = `/posts/${post.id}/edit`;

            return (
              <li key={post.id}>
                <Link
                  href={editHref}
                  className={`${UPCOMING_CARD_SHELL} ${CARD_INTERACTIVE}`}
                >
                  <article className="flex items-start gap-3">
                    <div className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-elevated)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:size-11">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toAbsoluteMediaSrc(
                            thumb,
                            mediaOrigin || undefined,
                          )}
                          alt={post.altText || ""}
                          className="absolute inset-0 size-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={statusBadgeClass(post.status)}
                          title="Статус поста"
                        >
                          {POST_DRAFT_STATUS_LABELS[post.status]}
                        </span>
                        <time
                          className="text-[12px] tabular-nums text-[var(--muted)]"
                          dateTime={scheduledAtIso(
                            post.publishDate,
                            post.publishTime,
                          )}
                        >
                          {formatScheduledRu(
                            post.publishDate,
                            post.publishTime,
                          )}
                        </time>
                        <span
                          className="text-[12px] text-[var(--muted)]"
                          aria-hidden
                        >
                          ·
                        </span>
                        <span className="text-[12px] text-[var(--accent)]">
                          {postTypeLabel(post.postType)}
                        </span>
                      </div>
                      {client && socialAcc ? (
                        <p className="mt-1.5 truncate text-[14px] font-medium leading-snug text-[var(--foreground)]">
                          {clientSocialSelectLabel(client, socialAcc)}
                        </p>
                      ) : client ? (
                        <p className="mt-1.5 truncate text-[14px] font-medium leading-snug text-[var(--foreground)]">
                          {client.fullName}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
                          Клиент {post.clientId}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">
                        {captionPreview}
                        {post.caption.length > captionPreview.length ? "…" : ""}
                      </p>
                      <p className="mt-1.5 text-[12px] font-medium text-[var(--accent)] underline-offset-2">
                        Редактировать
                      </p>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
