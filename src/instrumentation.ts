/**
 * Vercel вызывает `/api/cron/publish-telegram` по `vercel.json`.
 * На self‑host (PM2, `next start` локально) внешний cron часто не настроен — тогда
 * плановые посты в Telegram никто не забирает. Раз в минуту публикуем в этом же процессе.
 *
 * `TELEGRAM_SCHEDULE_POLL=0` — отключить, если публикуете только внешним `curl` в crontab.
 * На Vercel опрос не запускается (используется platform cron), см. `process.env.VERCEL`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.VERCEL) return;
  if (process.env.TELEGRAM_SCHEDULE_POLL === "0") return;

  const { publishDueTelegramScheduledPosts } = await import(
    "@/lib/publish-telegram-scheduled"
  );

  const tick = () => {
    void publishDueTelegramScheduledPosts()
      .then((summary) => {
        if (summary.published > 0 || summary.errors.length > 0) {
          console.log("[telegram schedule]", summary);
        }
      })
      .catch((e) => {
        console.error("[telegram schedule]", e);
      });
  };

  setTimeout(tick, 0);
  setInterval(tick, 60_000);
}
