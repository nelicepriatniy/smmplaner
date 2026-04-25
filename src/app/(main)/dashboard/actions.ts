"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DashboardActivityActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteDashboardActivityAction(
  activityId: string,
): Promise<DashboardActivityActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const id = activityId.trim();
  if (!id) return { ok: false, error: "Некорректный идентификатор." };

  const result = await prisma.activity.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) {
    return { ok: false, error: "Событие не найдено или уже удалено." };
  }

  revalidatePath("/");
  return { ok: true };
}
