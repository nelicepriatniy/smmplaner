"use client";

import { useRouter } from "next/navigation";
import type { ClientRecord } from "@/domain/smm";
import { socialAccountShortLabel } from "@/domain/smm";

type ClientCardProps = {
  client: ClientRecord;
};

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter();

  const goToClient = () => {
    router.push(`/clients/${client.id}`);
  };

  const accounts = client.socialAccounts;
  const primary = accounts[0];
  const ig = primary?.platform === "instagram" ? primary.instagramUsername.trim() : "";
  const igUrl =
    ig && ig !== "telegram" && ig !== "vk"
      ? `https://www.instagram.com/${encodeURIComponent(ig)}/`
      : null;

  const subtitle =
    accounts.length === 0
      ? "Нет подключённых соцсетей"
      : accounts.length === 1 && primary
        ? socialAccountShortLabel(primary)
        : `${accounts.length} соцсети`;

  return (
    <article
      className="flex h-full flex-col cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      role="link"
      tabIndex={0}
      aria-label={`${client.fullName}, подробности`}
      onClick={goToClient}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToClient();
        }
      }}
    >
      <h2 className="text-[16px] font-semibold leading-snug text-[var(--foreground)]">
        {client.fullName}
      </h2>
      {primary?.platform === "instagram" && igUrl ? (
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="mt-1.5 inline-flex w-fit text-[13px] text-[var(--muted)] underline-offset-2 transition-colors hover:text-[var(--accent)] hover:underline"
        >
          @{ig}
        </a>
      ) : (
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">{subtitle}</p>
      )}

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
    </article>
  );
}
