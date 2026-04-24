"use client";

import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import {
  PostsClientFilter,
  type PostsClientFilterOption,
} from "@/components/posts/PostsClientFilter";
import type { ClientRecord, PostDraftRecord } from "@/data/mockDb";

type CalendarWithClientFilterProps = {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
  filterOptions: PostsClientFilterOption[];
};

export function CalendarWithClientFilter({
  posts,
  clients,
  filterOptions,
}: CalendarWithClientFilterProps) {
  return (
    <div>
      <PostsClientFilter clients={filterOptions} />
      <ContentCalendar posts={posts} clients={clients} />
    </div>
  );
}
