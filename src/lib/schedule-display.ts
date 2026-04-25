import {
  PUBLISH_SCHEDULE_TZ,
  publishScheduleInstantMs,
} from "@/domain/smm";

/** Краткая подпись для «когда публикация» (время по Москве, как в плане). */
export function formatPublishScheduleLabelRu(
  publishDate: string,
  publishTime: string
): string {
  const d = new Date(
    publishScheduleInstantMs(publishDate, publishTime)
  );
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: PUBLISH_SCHEDULE_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function publishScheduleToIsoString(
  publishDate: string,
  publishTime: string
): string {
  return new Date(
    publishScheduleInstantMs(publishDate, publishTime)
  ).toISOString();
}
