import Image from "next/image";
import { isPublicUploadImageSrc } from "@/lib/media-display";
import Link from "next/link";
import {
  clientSocialSelectLabel,
  type ClientRecord,
  type PostDraftRecord,
} from "@/domain/smm";
import { POST_TYPE_OPTIONS } from "@/types/postType";

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
}: {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
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
        <ul className="flex min-h-0 flex-1 flex-col gap-3">
          {posts.map((post) => {
            const client = clientById[post.clientId];
            const socialAcc = client?.socialAccounts.find(
              (s) => s.id === post.socialAccountId
            );
            const thumb = post.imageUrls[0];
            const captionPreview =
              post.caption.split("\n").find((l) => l.trim())?.slice(0, 100) ??
              "Без текста";

            return (
              <li key={post.id}>
                <article className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:gap-4 sm:p-4">
                  <div className="relative size-[64px] shrink-0 overflow-hidden rounded-lg bg-[var(--surface-elevated)] sm:size-[72px]">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={post.altText || ""}
                        fill
                        className="object-cover"
                        sizes="72px"
                        unoptimized={isPublicUploadImageSrc(thumb)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <time
                        className="text-[13px] font-medium tabular-nums text-[var(--foreground)]"
                        dateTime={scheduledAtIso(post.publishDate, post.publishTime)}
                      >
                        {formatScheduledRu(post.publishDate, post.publishTime)}
                      </time>
                      <span className="text-[12px] text-[var(--muted)]" aria-hidden>
                        ·
                      </span>
                      <span className="text-[12px] text-[var(--accent)]">
                        {postTypeLabel(post.postType)}
                      </span>
                    </div>
                    {client && socialAcc ? (
                      <p className="mt-0.5 truncate text-[14px] font-semibold text-[var(--foreground)]">
                        {clientSocialSelectLabel(client, socialAcc)}
                      </p>
                    ) : client ? (
                      <p className="mt-0.5 truncate text-[14px] font-semibold text-[var(--foreground)]">
                        {client.fullName}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[14px] text-[var(--muted)]">
                        Клиент {post.clientId}
                      </p>
                    )}
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">
                      {captionPreview}
                      {post.caption.length > captionPreview.length ? "…" : ""}
                    </p>
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="mt-2 inline-block text-[12px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Редактировать
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
