import type { Metadata } from "next";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { mockClients, mockPostDrafts } from "@/data/mockDb";

export const metadata: Metadata = {
  title: "Календарь — smmplaner",
  description: "Планирование публикаций по датам",
};

export default function CalendarPage() {
  return (
    <main className="w-full py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Календарь
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Слоты по дням: запланированные, опубликованные и черновики (демо-данные).
        </p>
      </header>

      <ContentCalendar posts={mockPostDrafts} clients={mockClients} />
    </main>
  );
}
