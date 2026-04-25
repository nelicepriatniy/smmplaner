"use server";

import { revalidatePath } from "next/cache";
import type { ClientPlatform as DbClientPlatform, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { deletePostUploadedImageFiles } from "@/lib/post-upload-files";
import { prisma } from "@/lib/prisma";
import {
  firstTelegramChatIdForLegacyColumn,
  parseTelegramChatsJson,
  targetsToJsonForDb,
  type TelegramChatTarget,
} from "@/lib/telegram-targets";

const TG_INSTAGRAM_PLACEHOLDER = "telegram";
const VK_INSTAGRAM_PLACEHOLDER = "vk";

function parsePlatform(raw: string): DbClientPlatform {
  const x = raw.toLowerCase();
  if (x === "telegram") return "telegram";
  if (x === "vk") return "vk";
  if (x === "facebook") return "facebook";
  return "instagram";
}

export type ClientActionResult = { ok: true } | { ok: false; error: string };

function parseActivitySpheres(raw: string): string[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return ["—"];
  return parts;
}

function parseVkWallFromForm(formData: FormData):
  | { ok: true; vkOwnerId: string; vkFromGroup: boolean }
  | { ok: false; error: string } {
  const wallKind =
    String(formData.get("vkWallKind") ?? "group").toLowerCase() === "user"
      ? "user"
      : "group";
  const idDigits = String(formData.get("vkWallEntityId") ?? "").replace(/\D/g, "");
  if (!idDigits) {
    return {
      ok: false,
      error:
        "Для ВКонтакте укажите числовой ID: для группы — из ссылки club123… или public…, для личной стены — числовой id пользователя.",
    };
  }
  const vkOwnerId = wallKind === "group" ? `-${idDigits}` : idDigits;
  const vkFromGroup =
    wallKind === "group" && String(formData.get("vkFromGroup") ?? "") === "on";
  return { ok: true, vkOwnerId, vkFromGroup };
}

type SocialCreateInput = {
  platform: DbClientPlatform;
  instagramUsername: string;
  instagramBusinessId: string | null;
  facebookPageId: string | null;
  pageAccessToken: string | null;
  businessAccountConfirmed: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  telegramChats: TelegramChatTarget[];
  vkAccessToken: string | null;
  vkOwnerId: string | null;
  vkFromGroup: boolean;
};

function parseTelegramChatsFromFormData(
  formData: FormData
):
  | { ok: true; targets: TelegramChatTarget[] }
  | { ok: false; error: string } {
  const raw = String(formData.get("telegramChatsJson") ?? "").trim();
  if (!raw) {
    return {
      ok: false,
      error: "Добавьте хотя бы один чат Telegram (название и ID чата).",
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Некорректный JSON списка чатов Telegram." };
  }
  const targets = parseTelegramChatsJson(parsed)
    .map((t) => ({
      id: t.id.trim(),
      name: (t.name.trim() || t.chatId.trim()).trim(),
      chatId: t.chatId.trim(),
    }))
    .filter((t) => t.id && t.chatId);
  if (targets.length === 0) {
    return {
      ok: false,
      error: "Для каждого чата Telegram укажите непустой ID (и сохраните строку в JSON).",
    };
  }
  return { ok: true, targets };
}

function parseFirstSocialAccountFromForm(
  formData: FormData,
  mode: "create" | "update",
  existingTelegramToken: string | null | undefined,
  existingVkToken: string | null | undefined
):
  | { ok: true; data: SocialCreateInput }
  | { ok: false; error: string } {
  const platform = parsePlatform(String(formData.get("platform") ?? "instagram"));

  if (platform === "telegram") {
    const telegramBotTokenRaw = String(formData.get("telegramBotToken") ?? "").trim();
    const telegramBotToken =
      telegramBotTokenRaw ||
      (mode === "update" && existingTelegramToken?.trim() ? existingTelegramToken : null);
    const chatsRes = parseTelegramChatsFromFormData(formData);
    if (!chatsRes.ok) return chatsRes;
    if (!telegramBotToken) {
      return { ok: false, error: "Для Telegram укажите токен бота." };
    }
    const telegramChats = chatsRes.targets;
    const telegramChatId = firstTelegramChatIdForLegacyColumn(telegramChats);
    return {
      ok: true,
      data: {
        platform: "telegram",
        instagramUsername: TG_INSTAGRAM_PLACEHOLDER,
        instagramBusinessId: null,
        facebookPageId: null,
        pageAccessToken: null,
        businessAccountConfirmed: false,
        telegramBotToken,
        telegramChatId,
        telegramChats,
        vkAccessToken: null,
        vkOwnerId: null,
        vkFromGroup: false,
      },
    };
  }

  if (platform === "vk") {
    const vk = parseVkWallFromForm(formData);
    if (!vk.ok) return vk;
    const vkAccessTokenRaw = String(formData.get("vkAccessToken") ?? "").trim();
    const vkAccessToken =
      vkAccessTokenRaw ||
      (mode === "update" && existingVkToken?.trim() ? existingVkToken : null);
    if (!vkAccessToken) {
      return { ok: false, error: "Для ВКонтакте укажите access token." };
    }
    return {
      ok: true,
      data: {
        platform: "vk",
        instagramUsername: VK_INSTAGRAM_PLACEHOLDER,
        instagramBusinessId: null,
        facebookPageId: null,
        pageAccessToken: null,
        businessAccountConfirmed: false,
        telegramBotToken: null,
        telegramChatId: null,
        telegramChats: [],
        vkAccessToken,
        vkOwnerId: vk.vkOwnerId,
        vkFromGroup: vk.vkFromGroup,
      },
    };
  }

  if (platform === "facebook") {
    const pageSlug = String(formData.get("instagramUsername") ?? "")
      .trim()
      .replace(/^@+/, "")
      .replace(/\s+/g, "");
    if (!pageSlug) {
      return {
        ok: false,
        error: "Укажите короткое имя страницы (vanity URL), как в ссылке facebook.com/…",
      };
    }
    if (pageSlug === TG_INSTAGRAM_PLACEHOLDER || pageSlug === VK_INSTAGRAM_PLACEHOLDER) {
      return { ok: false, error: "Некорректное имя страницы Facebook." };
    }
    const facebookPageId =
      String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
    if (!facebookPageId) {
      return { ok: false, error: "Укажите числовой ID Facebook Page." };
    }
    const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
    const pageAccessToken = pageAccessTokenRaw || null;
    if (!pageAccessToken) {
      return { ok: false, error: "Укажите Page access token (долгоживущий, с нужными scope)." };
    }
    const instagramBusinessId =
      String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
    const businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";
    return {
      ok: true,
      data: {
        platform: "facebook",
        instagramUsername: pageSlug,
        instagramBusinessId,
        facebookPageId,
        pageAccessToken,
        businessAccountConfirmed,
        telegramBotToken: null,
        telegramChatId: null,
        telegramChats: [],
        vkAccessToken: null,
        vkOwnerId: null,
        vkFromGroup: false,
      },
    };
  }

  const instagramUsername = String(formData.get("instagramUsername") ?? "")
    .trim()
    .replace(/^@+/, "");
  if (!instagramUsername) {
    return { ok: false, error: "Укажите логин Instagram." };
  }
  const instagramBusinessId =
    String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
  const facebookPageId =
    String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
  const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
  const pageAccessToken = pageAccessTokenRaw || null;
  const businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";

  return {
    ok: true,
    data: {
      platform: "instagram",
      instagramUsername,
      instagramBusinessId,
      facebookPageId,
      pageAccessToken,
      businessAccountConfirmed,
      telegramBotToken: null,
      telegramChatId: null,
      telegramChats: [],
      vkAccessToken: null,
      vkOwnerId: null,
      vkFromGroup: false,
    },
  };
}

async function requireUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

export async function createClientAction(
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    return { ok: false, error: "Укажите название." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;

  const parsed = parseFirstSocialAccountFromForm(formData, "create", null, null);
  if (!parsed.ok) return parsed;

  const s = parsed.data;
  const activityDetail =
    s.platform === "telegram"
      ? `${fullName} (Telegram: ${s.telegramChats.map((t) => t.name || t.chatId).join(", ")})`
      : s.platform === "vk"
        ? `${fullName} (ВКонтакте, стена ${s.vkOwnerId})`
        : s.platform === "facebook"
          ? `${fullName} (Facebook Page ${s.facebookPageId}, ${s.instagramUsername})`
          : `${fullName} (@${s.instagramUsername})`;

  try {
    await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          userId,
          fullName,
          activitySpheres,
          contact,
        },
      });
      await tx.clientSocialAccount.create({
        data: {
          clientId: client.id,
          platform: s.platform,
          instagramUsername: s.instagramUsername,
          instagramBusinessId: s.instagramBusinessId,
          facebookPageId: s.facebookPageId,
          pageAccessToken: s.pageAccessToken,
          businessAccountConfirmed: s.businessAccountConfirmed,
          telegramBotToken: s.telegramBotToken,
          telegramChatId: s.telegramChatId,
          telegramChats:
            s.platform === "telegram" && s.telegramChats.length
              ? (targetsToJsonForDb(s.telegramChats) as Prisma.InputJsonValue)
              : undefined,
          vkAccessToken: s.vkAccessToken,
          vkOwnerId: s.vkOwnerId,
          vkFromGroup: s.vkFromGroup,
        },
      });
      await tx.activity.create({
        data: {
          userId,
          kind: "client_added",
          createdAt: new Date(),
          title: "Добавлен новый клиент",
          detail: activityDetail,
          clientId: client.id,
        },
      });
    });

    revalidatePath("/clients");
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/posts/new");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить клиента." };
  }
}

/** Только имя, сферы и контакт клиента (соцсети — отдельно на карточке). */
export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!existing) return { ok: false, error: "Клиент не найден." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    return { ok: false, error: "Укажите название." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName,
        activitySpheres,
        contact,
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/posts/new");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось обновить клиента." };
  }
}

export async function updateClientNotesAction(
  clientId: string,
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Клиент не найден." };

  const notesRaw = String(formData.get("notes") ?? "");
  const notes = notesRaw.trim() || null;

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { notes },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить заметки." };
  }
}

export async function addClientSocialAccountAction(
  clientId: string,
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) return { ok: false, error: "Клиент не найден." };

  const parsed = parseFirstSocialAccountFromForm(formData, "create", null, null);
  if (!parsed.ok) return parsed;
  const s = parsed.data;

  try {
    await prisma.clientSocialAccount.create({
      data: {
        clientId,
        platform: s.platform,
        instagramUsername: s.instagramUsername,
        instagramBusinessId: s.instagramBusinessId,
        facebookPageId: s.facebookPageId,
        pageAccessToken: s.pageAccessToken,
        businessAccountConfirmed: s.businessAccountConfirmed,
        telegramBotToken: s.telegramBotToken,
        telegramChatId: s.telegramChatId,
        telegramChats:
          s.platform === "telegram" && s.telegramChats.length
            ? (targetsToJsonForDb(s.telegramChats) as Prisma.InputJsonValue)
            : undefined,
        vkAccessToken: s.vkAccessToken,
        vkOwnerId: s.vkOwnerId,
        vkFromGroup: s.vkFromGroup,
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/posts/new");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось добавить соцсеть." };
  }
}

export async function updateClientSocialAccountAction(
  socialAccountId: string,
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.clientSocialAccount.findFirst({
    where: { id: socialAccountId, client: { userId } },
  });
  if (!existing) return { ok: false, error: "Аккаунт не найден." };

  const platform = existing.platform;
  const data: Prisma.ClientSocialAccountUpdateInput = {};

  if (platform === "instagram") {
    const instagramUsername = String(formData.get("instagramUsername") ?? "")
      .trim()
      .replace(/^@+/, "");
    if (!instagramUsername) {
      return { ok: false, error: "Укажите логин Instagram." };
    }
    data.instagramUsername = instagramUsername;
    data.instagramBusinessId =
      String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
    data.facebookPageId =
      String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
    data.businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";
    const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
    if (pageAccessTokenRaw) {
      data.pageAccessToken = pageAccessTokenRaw;
    }
  } else if (platform === "facebook") {
    const pageSlug = String(formData.get("instagramUsername") ?? "")
      .trim()
      .replace(/^@+/, "")
      .replace(/\s+/g, "");
    if (!pageSlug) {
      return {
        ok: false,
        error: "Укажите короткое имя страницы (vanity URL), как в ссылке facebook.com/…",
      };
    }
    if (pageSlug === TG_INSTAGRAM_PLACEHOLDER || pageSlug === VK_INSTAGRAM_PLACEHOLDER) {
      return { ok: false, error: "Некорректное имя страницы Facebook." };
    }
    data.instagramUsername = pageSlug;
    const fbPageId = String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
    if (!fbPageId) {
      return { ok: false, error: "Укажите числовой ID Facebook Page." };
    }
    data.facebookPageId = fbPageId;
    data.instagramBusinessId =
      String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
    data.businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";
    const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
    if (pageAccessTokenRaw) {
      data.pageAccessToken = pageAccessTokenRaw;
    } else if (!existing.pageAccessToken?.trim()) {
      return { ok: false, error: "Укажите Page access token." };
    }
  } else if (platform === "telegram") {
    const chatsRes = parseTelegramChatsFromFormData(formData);
    if (!chatsRes.ok) return chatsRes;
    data.telegramChats = targetsToJsonForDb(chatsRes.targets) as Prisma.InputJsonValue;
    data.telegramChatId = firstTelegramChatIdForLegacyColumn(chatsRes.targets);
    const telegramBotTokenRaw = String(formData.get("telegramBotToken") ?? "").trim();
    if (telegramBotTokenRaw) {
      data.telegramBotToken = telegramBotTokenRaw;
    } else if (!existing.telegramBotToken?.trim()) {
      return { ok: false, error: "Укажите токен бота от @BotFather." };
    }
  } else {
    const vk = parseVkWallFromForm(formData);
    if (!vk.ok) return vk;
    data.vkOwnerId = vk.vkOwnerId;
    data.vkFromGroup = vk.vkFromGroup;
    const vkAccessTokenRaw = String(formData.get("vkAccessToken") ?? "").trim();
    if (vkAccessTokenRaw) {
      data.vkAccessToken = vkAccessTokenRaw;
    } else if (!existing.vkAccessToken?.trim()) {
      return { ok: false, error: "Укажите access token ВКонтакте." };
    }
  }

  try {
    await prisma.clientSocialAccount.update({
      where: { id: socialAccountId },
      data,
    });
    const clientId = existing.clientId;
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/posts/new");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось обновить соцсеть." };
  }
}

export async function deleteClientSocialAccountAction(
  socialAccountId: string
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.clientSocialAccount.findFirst({
    where: { id: socialAccountId, client: { userId } },
    include: { _count: { select: { posts: true } } },
  });
  if (!existing) return { ok: false, error: "Аккаунт не найден." };
  if (existing._count.posts > 0) {
    return {
      ok: false,
      error: "Нельзя удалить соцсеть, к которой привязаны посты.",
    };
  }

  const clientId = existing.clientId;
  try {
    await prisma.clientSocialAccount.delete({ where: { id: socialAccountId } });
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/posts/new");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось удалить соцсеть." };
  }
}

export async function deleteClientAction(
  clientId: string
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Клиент не найден." };

  const postRows = await prisma.post.findMany({
    where: { userId, socialAccount: { clientId } },
    select: { id: true, imageUrls: true },
  });
  const postIds = postRows.map((p) => p.id);

  try {
    for (const p of postRows) {
      await deletePostUploadedImageFiles(userId, p.imageUrls);
    }
    await prisma.activity.updateMany({
      where: { userId, clientId },
      data: { clientId: null },
    });
    if (postIds.length > 0) {
      await prisma.activity.updateMany({
        where: { userId, postId: { in: postIds } },
        data: { postId: null },
      });
    }
    await prisma.post.deleteMany({
      where: { userId, socialAccount: { clientId } },
    });
    await prisma.client.delete({ where: { id: clientId } });

    for (const p of postRows) {
      revalidatePath(`/posts/${p.id}/edit`);
      revalidatePath(`/posts/${p.id}/discussion`);
    }
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/posts/new");
    revalidatePath("/posts/current");
    revalidatePath("/posts/archive");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось удалить клиента." };
  }
}
