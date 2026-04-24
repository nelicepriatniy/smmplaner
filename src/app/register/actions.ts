"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RegisterState = { error: string } | { ok: true };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerAction(
  _prev: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  const passwordConfirmRaw = formData.get("passwordConfirm");
  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  const passwordConfirm =
    typeof passwordConfirmRaw === "string" ? passwordConfirmRaw : "";

  if (!email || !password || !passwordConfirm) {
    return { error: "Укажите email, пароль и подтверждение" };
  }
  if (password !== passwordConfirm) {
    return { error: "Пароли не совпадают" };
  }
  if (!isValidEmail(email)) {
    return { error: "Некорректный email" };
  }
  if (password.length < 8) {
    return { error: "Пароль не короче 8 символов" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Пользователь с таким email уже есть" };
  }

  const passwordHash = await hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash },
  });

  return { ok: true };
}
