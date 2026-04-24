"use client";

import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import type { PostsClientFilterOption } from "@/components/posts/PostsClientFilter";
import type { ClientRecord, PostDraftRecord } from "@/domain/smm";
import { CalendarPageFilters } from "./CalendarPageFilters";

type CalendarWithClientFilterProps = {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
  filterOptions: PostsClientFilterOption[];
  defaultYear: number;
  defaultMonthIndex: number;
};

export function CalendarWithClientFilter({
  posts,
  clients,
  filterOptions,
  defaultYear,
  defaultMonthIndex,
}: CalendarWithClientFilterProps) {
  return (
    <ContentCalendar
      posts={posts}
      clients={clients}
      defaultYear={defaultYear}
      defaultMonthIndex={defaultMonthIndex}
      filtersSlot={
        <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/35 p-3 lg:p-3.5">
          <CalendarPageFilters clientOptions={filterOptions} />
        </div>
      }
    />
  );
}
