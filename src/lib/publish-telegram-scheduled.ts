import { revalidatePath } from "next/cache";
import { publishScheduleInstantMs } from "@/domain/smm";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { prisma } from "@/lib/prisma";
import { sendPostToTelegramChat } from "@/lib/telegram-send";
import {
  normalizeAccountTelegramChats,
  parsePostTelegramTargetIds,
  resolveTelegramChatIdsForTargets,
} from "@/lib/telegram-targets";

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
      socialAccount: { platform: "telegram" },
    },
    include: { socialAccount: true },
    orderBy: [{ publishDate: "asc" }, { publishTime: "asc" }],
  });

  const due = rows.filter((p) => {
    const token = p.socialAccount.telegramBotToken?.trim();
    if (!token) return false;
    const targets = normalizeAccountTelegramChats(
      p.socialAccount.telegramChats,
      p.socialAccount.telegramChatId
    );
    if (targets.length === 0) return false;
    let ids = parsePostTelegramTargetIds(p.telegramChatTargetIds);
    if (ids.length === 0) ids = targets.map((t) => t.id);
    const resolved = resolveTelegramChatIdsForTargets(targets, ids);
    if (!resolved.ok) return false;
    return publishScheduleInstantMs(p.publishDate, p.publishTime) <= nowMs;
  });

  const revalidateClientIds = new Set<string>();

  for (const post of due) {
    summary.processed += 1;
    const botToken = post.socialAccount.telegramBotToken?.trim();
    if (!botToken) {
      summary.skipped += 1;
      continue;
    }
    const targets = normalizeAccountTelegramChats(
      post.socialAccount.telegramChats,
      post.socialAccount.telegramChatId
    );
    let ids = parsePostTelegramTargetIds(post.telegramChatTargetIds);
    if (ids.length === 0) ids = targets.map((t) => t.id);
    const resolved = resolveTelegramChatIdsForTargets(targets, ids);
    if (!resolved.ok) {
      summary.errors.push({ postId: post.id, error: resolved.error });
      continue;
    }
    const imageUrls = postImageUrls(post.imageUrls);

    let sendOk = true;
    let sendErr = "";
    for (const chatId of resolved.chatIds) {
      const send = await sendPostToTelegramChat({
        botToken,
        chatId,
        caption: post.caption,
        imageUrls,
        appBaseUrl,
      });
      if (!send.ok) {
        sendOk = false;
        sendErr = send.error;
        break;
      }
    }

    if (!sendOk) {
      summary.errors.push({ postId: post.id, error: sendErr });
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

    const clientId = post.socialAccount.clientId;

    await prisma.activity.create({
      data: {
        userId: post.userId,
        kind: "post_published",
        createdAt: new Date(),
        title: "Пост опубликован в Telegram",
        detail: post.caption.trim().slice(0, 200) || undefined,
        postId: post.id,
        clientId,
      },
    });

    summary.published += 1;
    revalidateClientIds.add(clientId);
  }

  if (summary.published > 0) {
    revalidatePath("/");
    revalidatePath("/posts/current");
    revalidatePath("/posts/archive");
    revalidatePath("/calendar");
    revalidatePath("/clients");
    for (const clientId of revalidateClientIds) {
      revalidatePath(`/clients/${clientId}`);
    }
  }

  return summary;
}
