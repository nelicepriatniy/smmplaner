import Link from "next/link";
import { formatTimeAgoRuFrom } from "@/components/posts/postReviewUtils";
import type { ActivityKind, RecentActivityRecord } from "@/domain/smm";

const KIND_META: Record<
  ActivityKind,
  {
    label: string;
    /** Левая полоса + лёгкий фон карточки */
    card: string;
    dot: string;
    badge: string;
  }
> = {
  client_comment: {
    label: "Комментарий",
    card: "border-l-[3px] border-[color-mix(in_srgb,#fbbf24_72%,var(--border))] bg-[color-mix(in_srgb,#fbbf24_9%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#fbbf24_92%,#78716c)]",
    badge:
      "bg-[color-mix(in_srgb,#fbbf24_16%,transparent)] text-[color-mix(in_srgb,#fde68a_95%,#a16207)]",
  },
  client_approval: {
    label: "Одобрено",
    card: "border-l-[3px] border-[color-mix(in_srgb,#34d399_78%,var(--border))] bg-[color-mix(in_srgb,#34d399_10%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#6ee7b7_90%,#059669)]",
    badge:
      "bg-[color-mix(in_srgb,#34d399_18%,transparent)] text-[color-mix(in_srgb,#a7f3d0_95%,#047857)]",
  },
  client_rejection: {
    label: "Отклонено",
    card: "border-l-[3px] border-[color-mix(in_srgb,#fb7185_75%,var(--border))] bg-[color-mix(in_srgb,#fb7185_8%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#fb7185_88%,#be123c)]",
    badge:
      "bg-[color-mix(in_srgb,#fb7185_14%,transparent)] text-[color-mix(in_srgb,#fecdd3_92%,#9f1239)]",
  },
  post_published: {
    label: "В эфире",
    card: "border-l-[3px] border-[color-mix(in_srgb,#38bdf8_72%,var(--border))] bg-[color-mix(in_srgb,#38bdf8_9%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#7dd3fc_85%,#0369a1)]",
    badge:
      "bg-[color-mix(in_srgb,#38bdf8_16%,transparent)] text-[color-mix(in_srgb,#bae6fd_95%,#0369a1)]",
  },
  client_added: {
    label: "Клиент",
    card: "border-l-[3px] border-[color-mix(in_srgb,#a78bfa_74%,var(--border))] bg-[color-mix(in_srgb,#a78bfa_10%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#c4b5fd_88%,#6d28d9)]",
    badge:
      "bg-[color-mix(in_srgb,#a78bfa_16%,transparent)] text-[color-mix(in_srgb,#ddd6fe_92%,#5b21b6)]",
  },
  post_scheduled: {
    label: "Расписание",
    card: "border-l-[3px] border-[color-mix(in_srgb,#94a3b8_68%,var(--border))] bg-[color-mix(in_srgb,#94a3b8_8%,var(--surface))]",
    dot: "bg-[color-mix(in_srgb,#cbd5e1_78%,#64748b)]",
    badge:
      "bg-[color-mix(in_srgb,#94a3b8_14%,transparent)] text-[color-mix(in_srgb,#e2e8f0_88%,#475569)]",
  },
};

function activityHref(act: RecentActivityRecord): string | null {
  if (act.postId) {
    if (
      act.kind === "client_comment" ||
      act.kind === "client_approval" ||
      act.kind === "client_rejection"
    ) {
      return `/posts/${act.postId}/discussion`;
    }
    return `/posts/${act.postId}/edit`;
  }
  if (act.kind === "client_added") return "/clients";
  if (act.kind === "post_published") return "/posts/current";
  return null;
}

export function DashboardRecentActivity({
  activities,
  refMs,
}: {
  activities: RecentActivityRecord[];
  /** Опорное «сейчас» для подписей вроде «5 мин назад». */
  refMs: number;
}) {
  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-labelledby="dash-activity-heading"
    >
      <div className="mb-4 flex-shrink-0">
        <h2
          id="dash-activity-heading"
          className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]"
        >
          Недавняя активность
        </h2>
        <p className="mt-0.5 text-[13px] text-[var(--muted)]">
          Согласования, публикации и изменения по аккаунтам
        </p>
      </div>

      {activities.length === 0 ? (
        <p className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-[14px] text-[var(--muted)]">
          Пока нет событий для отображения.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2.5">
          {activities.map((act) => {
            const meta = KIND_META[act.kind];
            const href = activityHref(act);

            const body = (
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-[color-mix(in_srgb,var(--foreground)_10%,transparent)] ${meta.dot}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                    <time
                      className="text-[12px] tabular-nums text-[var(--muted)]"
                      dateTime={new Date(act.createdAtMs).toISOString()}
                    >
                      {formatTimeAgoRuFrom(act.createdAtMs, refMs)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-[var(--foreground)]">
                    {act.title}
                  </p>
                  {act.detail ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">
                      {act.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            );

            const cardBase = `rounded-xl border border-[var(--border)] py-3.5 pl-3.5 pr-3.5 sm:pl-4 sm:pr-4 ${meta.card}`;
            const interactive =
              "block transition-opacity hover:opacity-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

            return (
              <li key={act.id}>
                {href ? (
                  <Link href={href} className={`${cardBase} ${interactive}`}>
                    {body}
                  </Link>
                ) : (
                  <div className={cardBase}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
