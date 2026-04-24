import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { DashboardUpcomingPosts } from "@/components/dashboard/DashboardUpcomingPosts";
import {
  getDashboardStats,
  getRecentActivities,
  getUpcomingScheduledPosts,
  mockClients,
} from "@/data/mockDb";

export default function Home() {
  const stats = getDashboardStats();
  const upcoming = getUpcomingScheduledPosts(4);
  const recentActivity = getRecentActivities(8);

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
      <DashboardUpcomingPosts posts={upcoming} clients={mockClients} />
      <DashboardRecentActivity activities={recentActivity} />
    </main>
  );
}
