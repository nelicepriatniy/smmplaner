import { revalidatePath } from "next/cache";
import { publishScheduleInstantMs } from "@/domain/smm";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { prisma } from "@/lib/prisma";
import { sendPostToTelegramChat } from "@/lib/telegram-send";

export type TelegramPublishRunSummary = {
  processed: number;
  published: number;
  skipped: number;
  errors: { postId: string; error: string }[];
};

function postImageUrls(imageUrls: unknown): string[] {
  if (!Array.isArray(imageUrls)) return [];
  return imageUrls.filter((x): x is string => typeof x === "string");
}

/**
 * Находит запланированные посты клиентов Telegram, у которых наступило время публикации,
 * отправляет их в чат через Bot API и помечает пост как опубликованный.
 */
export async function publishDueTelegramScheduledPosts(
  nowMs: number = Date.now()
): Promise<TelegramPublishRunSummary> {
  const summary: TelegramPublishRunSummary = {
    processed: 0,
    published: 0,
    skipped: 0,
    errors: [],
  };

  const appBaseUrl = getAppBaseUrl();

  const rows = await prisma.post.findMany({
    where: {
      status: "scheduled",
      client: { platform: "telegram" },
    },
    include: { client: true },
    orderBy: [{ publishDate: "asc" }, { publishTime: "asc" }],
  });

  const due = rows.filter((p) => {
    const token = p.client.telegramBotToken?.trim();
    const chat = p.client.telegramChatId?.trim();
    if (!token || !chat) return false;
    return publishScheduleInstantMs(p.publishDate, p.publishTime) <= nowMs;
  });

  const revalidateClientIds = new Set<string>();

  for (const post of due) {
    summary.processed += 1;
    const botToken = post.client.telegramBotToken?.trim();
    const chatId = post.client.telegramChatId?.trim();
    if (!botToken || !chatId) {
      summary.skipped += 1;
      continue;
    }
    const imageUrls = postImageUrls(post.imageUrls);

    const send = await sendPostToTelegramChat({
      botToken,
      chatId,
      caption: post.caption,
      imageUrls,
      appBaseUrl,
    });

    if (!send.ok) {
      summary.errors.push({ postId: post.id, error: send.error });
      continue;
    }

    const updated = await prisma.post.updateMany({
      where: { id: post.id, status: "scheduled" },
      data: { status: "published" },
    });

    if (updated.count === 0) {
      summary.skipped += 1;
      continue;
    }

    await prisma.activity.create({
      data: {
        userId: post.userId,
        kind: "post_published",
        createdAt: new Date(),
        title: "Пост опубликован в Telegram",
        detail: post.caption.trim().slice(0, 200) || undefined,
        postId: post.id,
        clientId: post.clientId,
      },
    });

    summary.published += 1;
    revalidateClientIds.add(post.clientId);
  }

  if (summary.published > 0) {
    revalidatePath("/");
    revalidatePath("/posts/current");
    revalidatePath("/calendar");
    revalidatePath("/clients");
    for (const clientId of revalidateClientIds) {
      revalidatePath(`/clients/${clientId}`);
    }
  }

  return summary;
}
