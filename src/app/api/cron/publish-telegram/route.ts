import { NextResponse } from "next/server";
import { publishDueTelegramScheduledPosts } from "@/lib/publish-telegram-scheduled";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const q = new URL(request.url).searchParams.get("secret");
  return q === secret;
}

/** Плановая публикация постов Telegram (Vercel Cron, внешний cron или ручной вызов с секретом). */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await publishDueTelegramScheduledPosts();
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  return GET(request);
}
