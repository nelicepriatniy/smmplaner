"use client";

import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import {
  PostsClientFilter,
  type PostsClientFilterOption,
} from "@/components/posts/PostsClientFilter";
import type { ClientRecord, PostDraftRecord } from "@/domain/smm";

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
    <div>
      <PostsClientFilter clients={filterOptions} />
      <ContentCalendar
        posts={posts}
        clients={clients}
        defaultYear={defaultYear}
        defaultMonthIndex={defaultMonthIndex}
      />
    </div>
  );
}
