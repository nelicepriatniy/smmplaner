import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { DashboardUpcomingPosts } from "@/components/dashboard/DashboardUpcomingPosts";
import {
  computeDashboardStats,
  getRecentActivities,
  getUpcomingScheduledPosts,
} from "@/domain/smm";
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
  const upcoming = getUpcomingScheduledPosts(posts, 4, refMs);
  const recentActivity = getRecentActivities(activityRows, 8, refMs);

  return (
    <main className="w-full py-10 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Дашборд
        </h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">
          Сводка по клиентам и контенту
        </p>
      </header>
      <DashboardStatsRow stats={stats} />
      <DashboardUpcomingPosts posts={upcoming} clients={clients} />
      <DashboardRecentActivity activities={recentActivity} refMs={refMs} />
    </main>
  );
}
