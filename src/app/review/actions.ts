"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ReviewActionResult = { ok: true } | { ok: false; error: string };

function revalidateForPost(
  postId: string,
  token: string,
  clientId: string
) {
  revalidatePath(`/review/${encodeURIComponent(token)}`);
  revalidatePath("/");
  revalidatePath("/posts/current");
  revalidatePath(`/posts/${postId}/discussion`);
  revalidatePath(`/clients/${clientId}`);
}

export async function addDiscussionByTokenAction(
  token: string,
  text: string
): Promise<ReviewActionResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Пустое сообщение." };

  const post = await prisma.post.findFirst({
    where: { clientReviewToken: token.trim() },
    select: { id: true, userId: true, clientId: true },
  });
  if (!post) return { ok: false, error: "Ссылка недействительна." };

  try {
    await prisma.postReviewComment.create({
      data: {
        postId: post.id,
        side: "client",
        text: trimmed,
        createdAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        userId: post.userId,
        kind: "client_comment",
        createdAt: new Date(),
        title: "Клиент оставил комментарий к посту",
        detail: trimmed.slice(0, 200),
        postId: post.id,
        clientId: post.clientId,
      },
    });

    revalidateForPost(post.id, token, post.clientId);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось отправить сообщение." };
  }
}

export async function approvePostByTokenAction(
  token: string
): Promise<ReviewActionResult> {
  const post = await prisma.post.findFirst({
    where: { clientReviewToken: token.trim() },
    select: {
      id: true,
      userId: true,
      clientId: true,
    },
  });
  if (!post) return { ok: false, error: "Ссылка недействительна." };

  try {
    await prisma.$transaction([
      prisma.post.update({
        where: { id: post.id },
        data: { status: "scheduled" },
      }),
      prisma.activity.create({
        data: {
          userId: post.userId,
          kind: "client_approval",
          createdAt: new Date(),
          title: "Клиент одобрил пост",
          postId: post.id,
          clientId: post.clientId,
        },
      }),
    ]);

    revalidateForPost(post.id, token, post.clientId);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить решение." };
  }
}

export async function rejectPostByTokenAction(
  token: string
): Promise<ReviewActionResult> {
  const post = await prisma.post.findFirst({
    where: { clientReviewToken: token.trim() },
    select: { id: true, userId: true, clientId: true },
  });
  if (!post) return { ok: false, error: "Ссылка недействительна." };

  try {
    await prisma.$transaction([
      prisma.post.update({
        where: { id: post.id },
        data: { status: "rejected" },
      }),
      prisma.activity.create({
        data: {
          userId: post.userId,
          kind: "client_rejection",
          createdAt: new Date(),
          title: "Клиент отклонил вариант",
          postId: post.id,
          clientId: post.clientId,
        },
      }),
    ]);

    revalidateForPost(post.id, token, post.clientId);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить решение." };
  }
}
