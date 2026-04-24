"use server";

import { revalidatePath } from "next/cache";
import type { PostContentType } from "@prisma/client";
import { auth } from "@/auth";
import { newClientReviewToken } from "@/lib/clientReviewToken";
import { prisma } from "@/lib/prisma";
import type { PostType } from "@/types/postType";

export type PostActionResult =
  | { ok: true; postId?: string }
  | { ok: false; error: string };

export type PostSavePayload = {
  clientId: string;
  postType: PostType;
  caption: string;
  location: string;
  firstComment: string;
  altText: string;
  imageUrls: string[];
  publishDate: string;
  publishTime: string;
};

async function requireUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

function filterRemoteImageUrls(urls: string[]): string[] {
  return urls.filter((u) => /^https?:\/\//i.test(u));
}

function revalidatePostPaths(userId: string, postId: string, clientId: string) {
  revalidatePath("/");
  revalidatePath("/posts/current");
  revalidatePath("/posts/new");
  revalidatePath("/calendar");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/posts/${postId}/edit`);
  revalidatePath(`/posts/${postId}/discussion`);
}

export async function createDraftPostAction(
  payload: PostSavePayload
): Promise<PostActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const client = await prisma.client.findFirst({
    where: { id: payload.clientId, userId },
  });
  if (!client) return { ok: false, error: "Клиент не найден." };

  const imageUrls = filterRemoteImageUrls(payload.imageUrls);
  const token = newClientReviewToken();

  try {
    const post = await prisma.post.create({
      data: {
        userId,
        clientId: payload.clientId,
        status: "draft",
        postType: payload.postType as PostContentType,
        caption: payload.caption,
        location: payload.location,
        firstComment: payload.firstComment,
        altText: payload.altText,
        imageUrls,
        publishDate: payload.publishDate,
        publishTime: payload.publishTime,
        createdAt: new Date(),
        clientReviewToken: token,
      },
    });

    revalidatePostPaths(userId, post.id, payload.clientId);
    return { ok: true, postId: post.id };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось создать черновик." };
  }
}

export async function updatePostAction(
  postId: string,
  payload: PostSavePayload
): Promise<PostActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const existing = await prisma.post.findFirst({
    where: { id: postId, userId },
  });
  if (!existing) return { ok: false, error: "Пост не найден." };

  const client = await prisma.client.findFirst({
    where: { id: payload.clientId, userId },
  });
  if (!client) return { ok: false, error: "Клиент не найден." };

  const imageUrls = filterRemoteImageUrls(payload.imageUrls);

  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        clientId: payload.clientId,
        postType: payload.postType as PostContentType,
        caption: payload.caption,
        location: payload.location,
        firstComment: payload.firstComment,
        altText: payload.altText,
        imageUrls,
        publishDate: payload.publishDate,
        publishTime: payload.publishTime,
      },
    });

    revalidatePostPaths(userId, postId, payload.clientId);
    return { ok: true, postId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось сохранить пост." };
  }
}

export async function addPostDiscussionCommentAction(
  postId: string,
  text: string
): Promise<PostActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Нужна авторизация." };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Пустое сообщение." };

  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
    select: { id: true, clientId: true },
  });
  if (!post) return { ok: false, error: "Пост не найден." };

  try {
    await prisma.postReviewComment.create({
      data: {
        postId: post.id,
        side: "self",
        text: trimmed,
        createdAt: new Date(),
      },
    });
    revalidatePostPaths(userId, post.id, post.clientId);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Не удалось отправить сообщение." };
  }
}
