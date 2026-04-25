import type { DashboardStat } from "@/domain/smm";

const VALUE_TEXT_BY_STAT_ID: Record<DashboardStat["id"], string> = {
  total: "text-[color:var(--post-status-draft-border)]",
  review: "text-[color:var(--post-status-in-review-border)]",
  scheduled: "text-[color:var(--post-status-scheduled-border)]",
  clients: "text-[color:var(--post-status-published-border)]",
};

export function DashboardStatsRow({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="flex w-full min-w-0 flex-row flex-nowrap gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:gap-4 lg:overflow-x-visible lg:pb-0">
      {stats.map((s) => (
        <div
          key={s.id}
          className="min-w-[11rem] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3.5 sm:min-w-[12rem] sm:px-5 sm:py-4 lg:min-w-0 lg:flex-1"
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            {s.label}
          </p>
          <p
            className={`mt-1.5 text-[26px] font-semibold tabular-nums tracking-tight sm:text-[28px] ${VALUE_TEXT_BY_STAT_ID[s.id]}`}
          >
            {s.value}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
