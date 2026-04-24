"use client";

import type { ClientRecord } from "@/data/mockDb";

const btnEditClass =
  "mt-5 w-full rounded-xl border border-[var(--border)] py-2.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:bg-[var(--surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

type ClientCardProps = {
  client: ClientRecord;
  onEdit: () => void;
};

export function ClientCard({ client, onEdit }: ClientCardProps) {
  const ig = client.instagramUsername;
  const igUrl = `https://www.instagram.com/${encodeURIComponent(ig)}/`;

  return (
    <article className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))]">
      <h2 className="text-[16px] font-semibold leading-snug text-[var(--foreground)]">
        {client.fullName}
      </h2>
      <a
        href={igUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex w-fit text-[13px] text-[var(--muted)] underline-offset-2 transition-colors hover:text-[var(--accent)] hover:underline"
      >
        @{ig}
      </a>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            Всего
          </dt>
          <dd className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--foreground)]">
            {client.postsTotal}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            Месяц
          </dt>
          <dd className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--foreground)]">
            {client.postsThisMonth}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            Соглас.
          </dt>
          <dd
            className={`mt-1 text-[20px] font-semibold tabular-nums ${
              client.postsPendingReview > 0
                ? "text-[var(--accent)]"
                : "text-[var(--foreground)]"
            }`}
          >
            {client.postsPendingReview}
          </dd>
        </div>
      </dl>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Сферы деятельности">
        {client.activitySpheres.map((sphere) => (
          <li
            key={sphere}
            className="rounded-md bg-[var(--surface-elevated)] px-2.5 py-1 text-[12px] text-[var(--muted)]"
          >
            {sphere}
          </li>
        ))}
      </ul>

      <button type="button" onClick={onEdit} className={btnEditClass}>
        Редактирование клиента
      </button>
    </article>
  );
}
