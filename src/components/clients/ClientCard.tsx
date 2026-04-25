"use client";

import { useRouter } from "next/navigation";
import { SocialPlatformIcon } from "@/components/icons/SocialPlatformIcon";
import type { ClientRecord } from "@/domain/smm";
import { clientPlatformName, socialAccountShortLabel } from "@/domain/smm";

const POST_COUNT_NUM_CLASS: Record<"total" | "scheduled" | "in_review", string> =
  {
    total: "text-[color:var(--post-status-draft-border)]",
    scheduled: "text-[color:var(--post-status-scheduled-border)]",
    in_review: "text-[color:var(--post-status-in-review-border)]",
  };

const btnOpenClass =
  "inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

type ClientCardProps = {
  client: ClientRecord;
};

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter();

  const goToClient = () => {
    router.push(`/clients/${client.id}`);
  };

  const accounts = client.socialAccounts;

  return (
    <article
      className="flex h-full min-h-0 cursor-pointer flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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

      <div className="mt-3 min-w-0">
        {accounts.length === 0 ? (
          <p className="text-[12px] text-[var(--muted)]">
            Нет подключённых соцсетей
          </p>
        ) : (
          <ul
            className="flex flex-wrap items-center gap-2.5"
            aria-label="Подключённые соцсети"
          >
            {accounts.map((acc) => {
              const details = socialAccountShortLabel(acc);
              return (
                <li
                  key={acc.id}
                  className="flex min-w-0 max-w-full shrink-0 items-center gap-1.5"
                  title={details}
                >
                  <SocialPlatformIcon
                    platform={acc.platform}
                    className="size-5"
                  />
                  <span className="min-w-0 truncate text-[12px] text-[var(--foreground)]">
                    {clientPlatformName(acc.platform)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-5 sm:gap-3">
        <div className="min-w-0">
          <dt className="text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-[var(--muted)] sm:text-[11px]">
            Всего
          </dt>
          <dd
            className={`mt-1 text-[20px] font-semibold tabular-nums sm:text-[22px] ${POST_COUNT_NUM_CLASS.total}`}
          >
            {client.postsTotal}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-[var(--muted)] sm:text-[11px]">
            Заплан.
          </dt>
          <dd
            className={`mt-1 text-[20px] font-semibold tabular-nums sm:text-[22px] ${POST_COUNT_NUM_CLASS.scheduled}`}
            title="Запланировано"
          >
            {client.postsScheduled}
          </dd>
        </div>
        <div className="min-w-0">
          <dt
            className="text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-[var(--muted)] sm:text-[11px]"
            title="На согласовании"
          >
            Соглас.
          </dt>
          <dd
            className={`mt-1 text-[20px] font-semibold tabular-nums sm:text-[22px] ${POST_COUNT_NUM_CLASS.in_review}`}
            title="На согласовании"
          >
            {client.postsPendingReview}
          </dd>
        </div>
      </dl>

      <ul className="mt-5 flex min-h-0 flex-1 flex-wrap content-start gap-2" aria-label="Сферы деятельности">
        {client.activitySpheres.map((sphere) => (
          <li
            key={sphere}
            className="rounded-md bg-[var(--surface-elevated)] px-2.5 py-1 text-[12px] text-[var(--muted)] h-fit"
          >
            {sphere}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToClient();
          }}
          className={btnOpenClass}
        >
          Открыть
        </button>
      </div>
    </article>
  );
}
