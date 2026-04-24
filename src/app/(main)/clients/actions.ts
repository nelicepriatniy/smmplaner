"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const fullName = String(formData.get("fullName") ?? "").trim();
  const instagramUsername = String(formData.get("instagramUsername") ?? "")
    .trim()
    .replace(/^@+/, "");
  if (!fullName || !instagramUsername) {
    return { ok: false, error: "Укажите название и логин Instagram." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const instagramBusinessId =
    String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
  const facebookPageId =
    String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
  const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
  const pageAccessToken = pageAccessTokenRaw || null;
  const businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        fullName,
        instagramUsername,
        activitySpheres,
        contact,
        instagramBusinessId,
        facebookPageId,
        pageAccessToken,
        businessAccountConfirmed,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        kind: "client_added",
        createdAt: new Date(),
        title: "Добавлен новый клиент",
        detail: `${fullName} (@${instagramUsername})`,
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

  const fullName = String(formData.get("fullName") ?? "").trim();
  const instagramUsername = String(formData.get("instagramUsername") ?? "")
    .trim()
    .replace(/^@+/, "");
  if (!fullName || !instagramUsername) {
    return { ok: false, error: "Укажите название и логин Instagram." };
  }

  const activitySpheres = parseActivitySpheres(
    String(formData.get("activitySpheres") ?? "")
  );
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const instagramBusinessId =
    String(formData.get("instagramBusinessId") ?? "").replace(/\D/g, "") || null;
  const facebookPageId =
    String(formData.get("facebookPageId") ?? "").replace(/\D/g, "") || null;
  const pageAccessTokenRaw = String(formData.get("pageAccessToken") ?? "").trim();
  const businessAccountConfirmed = formData.get("businessAccountConfirmed") === "on";

  const data: Prisma.ClientUpdateInput = {
    fullName,
    instagramUsername,
    activitySpheres,
    contact,
    instagramBusinessId,
    facebookPageId,
    businessAccountConfirmed,
  };
  if (pageAccessTokenRaw) {
    data.pageAccessToken = pageAccessTokenRaw;
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
