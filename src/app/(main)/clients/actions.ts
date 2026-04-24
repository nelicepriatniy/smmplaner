"use server";

import { revalidatePath } from "next/cache";
import type { ClientPlatform as DbClientPlatform, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TG_INSTAGRAM_PLACEHOLDER = "telegram";
const VK_INSTAGRAM_PLACEHOLDER = "vk";

function parsePlatform(raw: string): DbClientPlatform {
  const x = raw.toLowerCase();
  if (x === "telegram") return "telegram";
  if (x === "vk") return "vk";
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

async function requireUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

export async function createClientAction(
  formData: FormData
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const platform = parsePlatform(String(formData.get("platform") ?? "instagram"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    return { ok: false, error: "Укажите название." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;

  let instagramUsername: string;
  let instagramBusinessId: string | null;
  let facebookPageId: string | null;
  let pageAccessToken: string | null;
  let businessAccountConfirmed: boolean;
  let telegramBotToken: string | null;
  let telegramChatId: string | null;
  let vkAccessToken: string | null;
  let vkOwnerId: string | null;
  let vkFromGroup: boolean;

  if (platform === "telegram") {
    telegramBotToken = String(formData.get("telegramBotToken") ?? "").trim() || null;
    telegramChatId = String(formData.get("telegramChatId") ?? "").trim() || null;
    if (!telegramBotToken || !telegramChatId) {
      return { ok: false, error: "Для Telegram укажите токен бота и ID чата." };
    }
    instagramUsername = TG_INSTAGRAM_PLACEHOLDER;
    instagramBusinessId = null;
    facebookPageId = null;
    pageAccessToken = null;
    businessAccountConfirmed = false;
    vkAccessToken = null;
    vkOwnerId = null;
    vkFromGroup = false;
  } else if (platform === "vk") {
    const vk = parseVkWallFromForm(formData);
    if (!vk.ok) return { ok: false, error: vk.error };
    vkAccessToken = String(formData.get("vkAccessToken") ?? "").trim() || null;
    if (!vkAccessToken) {
      return { ok: false, error: "Для ВКонтакте укажите access token." };
    }
    vkOwnerId = vk.vkOwnerId;
    vkFromGroup = vk.vkFromGroup;
    instagramUsername = VK_INSTAGRAM_PLACEHOLDER;
    instagramBusinessId = null;
    facebookPageId = null;
    pageAccessToken = null;
    businessAccountConfirmed = false;
    telegramBotToken = null;
    telegramChatId = null;
  } else {
    instagramUsername = String(formData.get("instagramUsername") ?? "")
      .trim()
      .replace(/^@+/, "");
    if (!instagramUsername) {
      return { ok: false, error: "Укажите название и логин Instagram." };
    }
    instagramBusinessId =
      String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
    facebookPageId =
      String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
    const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
    pageAccessToken = pageAccessTokenRaw || null;
    businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";
    telegramBotToken = null;
    telegramChatId = null;
    vkAccessToken = null;
    vkOwnerId = null;
    vkFromGroup = false;
  }

  const activityDetail =
    platform === "telegram"
      ? `${fullName} (Telegram, чат ${telegramChatId})`
      : platform === "vk"
        ? `${fullName} (ВКонтакте, стена ${vkOwnerId})`
        : `${fullName} (@${instagramUsername})`;

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        fullName,
        platform,
        instagramUsername,
        activitySpheres,
        contact,
        instagramBusinessId,
        facebookPageId,
        pageAccessToken,
        businessAccountConfirmed,
        telegramBotToken,
        telegramChatId,
        vkAccessToken,
        vkOwnerId,
        vkFromGroup,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        kind: "client_added",
        createdAt: new Date(),
        title: "Добавлен новый клиент",
        detail: activityDetail,
        clientId: client.id,
      },
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

  const platform = parsePlatform(String(formData.get("platform") ?? "instagram"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    return { ok: false, error: "Укажите название." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;

  let instagramUsername: string;
  let instagramBusinessId: string | null;
  let facebookPageId: string | null;
  let businessAccountConfirmed: boolean;
  let telegramChatId: string | null;

  if (platform === "telegram") {
    telegramChatId = String(formData.get("telegramChatId") ?? "").trim() || null;
    if (!telegramChatId) {
      return { ok: false, error: "Для Telegram укажите ID чата." };
    }
    instagramUsername =
      existing.platform === "telegram"
        ? existing.instagramUsername
        : TG_INSTAGRAM_PLACEHOLDER;
    instagramBusinessId = null;
    facebookPageId = null;
    businessAccountConfirmed = false;
  } else if (platform === "vk") {
    const vk = parseVkWallFromForm(formData);
    if (!vk.ok) return { ok: false, error: vk.error };
    telegramChatId = null;
    instagramUsername =
      existing.platform === "vk" ? existing.instagramUsername : VK_INSTAGRAM_PLACEHOLDER;
    instagramBusinessId = null;
    facebookPageId = null;
    businessAccountConfirmed = false;
  } else {
    instagramUsername = String(formData.get("instagramUsername") ?? "")
      .trim()
      .replace(/^@+/, "");
    if (!instagramUsername) {
      return { ok: false, error: "Укажите название и логин Instagram." };
    }
    instagramBusinessId =
      String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
    facebookPageId =
      String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
    businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";
    telegramChatId = null;
  }

  const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
  const telegramBotTokenRaw = String(formData.get("telegramBotToken") ?? "").trim();
  const vkAccessTokenRaw = String(formData.get("vkAccessToken") ?? "").trim();

  const data: Prisma.ClientUpdateInput = {
    fullName,
    platform,
    instagramUsername,
    activitySpheres,
    contact,
    instagramBusinessId,
    facebookPageId,
    businessAccountConfirmed,
    telegramChatId,
  };

  if (platform === "instagram") {
    if (pageAccessTokenRaw) {
      data.pageAccessToken = pageAccessTokenRaw;
    }
    data.telegramBotToken = null;
    data.vkAccessToken = null;
    data.vkOwnerId = null;
    data.vkFromGroup = false;
  } else if (platform === "telegram") {
    data.pageAccessToken = null;
    data.vkAccessToken = null;
    data.vkOwnerId = null;
    data.vkFromGroup = false;
    if (telegramBotTokenRaw) {
      data.telegramBotToken = telegramBotTokenRaw;
    } else if (!existing.telegramBotToken?.trim()) {
      return {
        ok: false,
        error: "Укажите токен бота от @BotFather.",
      };
    }
  } else {
    const vk = parseVkWallFromForm(formData);
    if (!vk.ok) return { ok: false, error: vk.error };
    data.pageAccessToken = null;
    data.telegramBotToken = null;
    data.vkOwnerId = vk.vkOwnerId;
    data.vkFromGroup = vk.vkFromGroup;
    if (vkAccessTokenRaw) {
      data.vkAccessToken = vkAccessTokenRaw;
    } else if (!existing.vkAccessToken?.trim()) {
      return {
        ok: false,
        error: "Укажите access token ВКонтакте.",
      };
    }
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data,
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
