"use server";

import { revalidatePath } from "next/cache";
import type { ClientPlatform as DbClientPlatform, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TG_INSTAGRAM_PLACEHOLDER = "telegram";

function parsePlatform(raw: string): DbClientPlatform {
  return raw.toLowerCase() === "telegram" ? "telegram" : "instagram";
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
  }

  const activityDetail =
    platform === "telegram"
      ? `${fullName} (Telegram, чат ${telegramChatId})`
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
  } else {
    data.pageAccessToken = null;
    if (telegramBotTokenRaw) {
      data.telegramBotToken = telegramBotTokenRaw;
    } else if (!existing.telegramBotToken?.trim()) {
      return {
        ok: false,
        error: "Укажите токен бота от @BotFather.",
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
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось обновить клиента." };
  }
}
