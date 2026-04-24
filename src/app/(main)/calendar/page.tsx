import type { Metadata } from "next";
import { Suspense } from "react";
import { mockClients, mockPostDrafts } from "@/data/mockDb";
import { CalendarWithClientFilter } from "./CalendarWithClientFilter";

export const metadata: Metadata = {
  title: "Календарь — smmplaner",
  description: "Планирование публикаций по датам",
};

type PageProps = {
  searchParams: Promise<{ client?: string }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const { client: clientParam } = await searchParams;

  const filterClientId =
    typeof clientParam === "string" &&
    mockClients.some((c) => c.id === clientParam)
      ? clientParam
      : undefined;

  const displayPosts = mockPostDrafts.filter((p) =>
    filterClientId ? p.clientId === filterClientId : true
  );

  const filterOptions = mockClients.map((c) => ({
    id: c.id,
    label: `${c.fullName} (@${c.instagramUsername})`,
  }));

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

      <Suspense
        fallback={
          <div className="min-h-48 text-[14px] text-[var(--muted)]">
            Загрузка календаря…
          </div>
        }
      >
        <CalendarWithClientFilter
          posts={displayPosts}
          clients={mockClients}
          filterOptions={filterOptions}
        />
      </Suspense>
    </main>
  );
}
