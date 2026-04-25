"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type PersonalBotResult = { ok: true } | { ok: false; error: string };

function looksLikeTelegramBotToken(s: string): boolean {
  return /^\d+:[A-Za-z0-9_-]+$/.test(s) && s.length >= 30;
}

export async function updatePersonalTelegramBotAction(
  formData: FormData
): Promise<PersonalBotResult> {
  const s = await auth();
  const uid = s?.user?.id;
  if (!uid) return { ok: false, error: "Нужна авторизация." };
  const raw = String(formData.get("personalTelegramBotToken") ?? "").trim();
  if (raw) {
    if (!looksLikeTelegramBotToken(raw)) {
      return {
        ok: false,
        error: "Похоже, это не токен бота. Должно быть так: цифры, двоеточие, длинный ключ (из @BotFather).",
      };
    }
  }
  try {
    await prisma.user.update({
      where: { id: uid },
      data: { personalTelegramBotToken: raw || null },
    });
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить." };
  }
}
