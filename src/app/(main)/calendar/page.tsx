import type { Metadata } from "next";
import { Suspense } from "react";
import { calendarAnchorFromPosts, clientSelectLabel } from "@/domain/smm";
import {
  parseClientIdsFromSearchParam,
  parsePlatformsFromSearchParam,
  parseStatusesFromSearchParam,
} from "./calendarFilters";
import { CalendarWithClientFilter } from "./CalendarWithClientFilter";
import { getServerRefMs } from "@/lib/serverRefMs";
import {
  listClientsForUser,
  listPostsForUser,
  requireUserId,
} from "@/lib/smm-data";

export const metadata: Metadata = {
  title: "Календарь — smmplaner",
  description: "Планирование публикаций по датам",
};

type PageProps = {
  searchParams: Promise<{
    client?: string;
    platform?: string;
    status?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const clientParam = sp.client;
  const platformParam = sp.platform;
  const statusParam = sp.status;
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const [clients, allPosts] = await Promise.all([
    listClientsForUser(userId, refMs),
    listPostsForUser(userId),
  ]);

  const validClientIds = new Set(clients.map((c) => c.id));
  const filterClientIds = parseClientIdsFromSearchParam(clientParam, validClientIds);

  const platformFilter = parsePlatformsFromSearchParam(platformParam);
  const statusFilter = parseStatusesFromSearchParam(statusParam);

  let displayPosts = allPosts.filter((p) =>
    filterClientIds.length > 0 ? filterClientIds.includes(p.clientId) : true
  );
  if (platformFilter.length > 0) {
    displayPosts = displayPosts.filter((p) =>
      platformFilter.includes(p.socialAccount.platform)
    );
  }
  if (statusFilter.length > 0) {
    displayPosts = displayPosts.filter((p) => statusFilter.includes(p.status));
  }

  const filterOptions = clients.map((c) => ({
    id: c.id,
    label: clientSelectLabel(c),
  }));

  const anchor = calendarAnchorFromPosts(displayPosts);

  return (
    <main className="w-full py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Календарь
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Слоты по дням: фильтры, вид «месяц / неделя» и сетка.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="min-h-48 text-[14px] text-[var(--muted)]">
            Загрузка календаря…
          </div>
        }
      >
        <CalendarWithClientFilter
          posts={displayPosts}
          clients={clients}
          filterOptions={filterOptions}
          defaultYear={anchor.year}
          defaultMonthIndex={anchor.monthIndex}
        />
      </Suspense>
    </main>
  );
}
