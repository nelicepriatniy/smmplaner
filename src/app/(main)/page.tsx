import { headers } from "next/headers";
import { DashboardHeaderActions } from "@/components/dashboard/DashboardHeaderActions";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { DashboardUpcomingPosts } from "@/components/dashboard/DashboardUpcomingPosts";
import {
  computeDashboardStats,
  getRecentActivities,
  getUpcomingScheduledPosts,
} from "@/domain/smm";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  listActivitiesForUser,
  listClientsForUser,
  listPostsForUser,
  requireUserId,
} from "@/lib/smm-data";
import { getServerRefMs } from "@/lib/serverRefMs";

export default async function Home() {
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const [clients, posts, activityRows] = await Promise.all([
    listClientsForUser(userId, refMs),
    listPostsForUser(userId),
    listActivitiesForUser(userId, 20, refMs),
  ]);
  const stats = computeDashboardStats(clients, posts, refMs);
  const upcoming = getUpcomingScheduledPosts(posts, 6, refMs);
  const recentActivity = getRecentActivities(activityRows, 8, refMs);

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const mediaOrigin = host ? `${proto}://${host}` : getAppBaseUrl() ?? "";

  return (
    <main className="w-full py-10 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
              Дашборд
            </h1>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              Сводка по клиентам и контенту
            </p>
          </div>
          <DashboardHeaderActions />
        </div>
      </header>
      <DashboardStatsRow stats={stats} />
      <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <DashboardUpcomingPosts
            posts={upcoming}
            clients={clients}
            mediaOrigin={mediaOrigin}
          />
        </div>
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <DashboardRecentActivity
            activities={recentActivity}
            refMs={refMs}
          />
        </div>
      </div>
    </main>
  );
}
