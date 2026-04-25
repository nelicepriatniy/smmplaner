import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarPageFilters } from "@/app/(main)/calendar/CalendarPageFilters";
import {
  CURRENT_POSTS_STATUS_FILTER_OPTIONS,
  parseClientIdsFromSearchParam,
  parsePlatformsFromSearchParam,
  parseStatusesFromSearchParam,
} from "@/app/(main)/calendar/calendarFilters";
import {
  PostsListView,
  sortPostsByPublishSchedule,
} from "@/components/posts/PostsListView";
import { headerAccentButtonClass } from "@/lib/headerAccentButtonClass";
import { getSiteOriginFromHeaders } from "@/lib/media-display";
import { getServerRefMs } from "@/lib/serverRefMs";
import { clientSelectLabel } from "@/domain/smm";
import {
  listClientsForUser,
  listPostsForUser,
  requireUserId,
} from "@/lib/smm-data";

export const metadata: Metadata = {
  title: "Актуальные посты — smmplaner",
  description: "Запланированные и недавно созданные посты",
};

type PageProps = {
  searchParams: Promise<{
    client?: string;
    platform?: string;
    status?: string;
  }>;
};

const allowedCurrentStatuses = new Set(
  CURRENT_POSTS_STATUS_FILTER_OPTIONS.map((o) => o.id),
);

export default async function CurrentPostsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const [clients, allPosts] = await Promise.all([
    listClientsForUser(userId, refMs),
    listPostsForUser(userId),
  ]);

  const hdrs = await headers();
  const siteOrigin = getSiteOriginFromHeaders(hdrs);

  const validClientIds = new Set(clients.map((c) => c.id));
  const filterClientIds = parseClientIdsFromSearchParam(
    sp.client,
    validClientIds,
  );
  const platformFilter = parsePlatformsFromSearchParam(sp.platform);
  const statusFilter = parseStatusesFromSearchParam(sp.status).filter((s) =>
    allowedCurrentStatuses.has(s),
  );

  let rows = allPosts.filter((p) => p.status !== "published");
  rows = rows.filter((p) =>
    filterClientIds.length > 0 ? filterClientIds.includes(p.clientId) : true,
  );
  if (platformFilter.length > 0) {
    rows = rows.filter((p) =>
      platformFilter.includes(p.socialAccount.platform),
    );
  }
  if (statusFilter.length > 0) {
    rows = rows.filter((p) => statusFilter.includes(p.status));
  }
  rows = sortPostsByPublishSchedule(rows);

  const hasActiveFilters =
    filterClientIds.length > 0 ||
    platformFilter.length > 0 ||
    statusFilter.length > 0;

  const filterOptions = clients.map((c) => ({
    id: c.id,
    label: clientSelectLabel(c),
  }));

  return (
    <main className="w-full py-10 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
              Актуальные посты
            </h1>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              Черновики и запланированные публикации из базы данных.
            </p>
          </div>
          <div className="flex w-full flex-shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
            <Link href="/posts/new" className={headerAccentButtonClass}>
              Создать пост
            </Link>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div
            className="mb-6 h-10 w-full animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]/50"
            aria-hidden
          />
        }
      >
        <div className="mb-5 w-full min-w-0 border-b border-[var(--border)] pb-3 sm:mb-6">
          <CalendarPageFilters
            clientOptions={filterOptions}
            direction="row"
            statusOptions={CURRENT_POSTS_STATUS_FILTER_OPTIONS}
          />
        </div>
      </Suspense>

      <PostsListView
        rows={rows}
        clients={clients}
        siteOrigin={siteOrigin}
        refMs={refMs}
        hasActiveFilters={hasActiveFilters}
        emptyFilteredMessage="Нет постов, подходящих под выбранные фильтры."
        emptyNoFiltersMessage="Постов пока нет. Создайте пост в разделе «Новый пост» или импортируйте демо через сид."
        showNotifyClientButton
      />
    </main>
  );
}
