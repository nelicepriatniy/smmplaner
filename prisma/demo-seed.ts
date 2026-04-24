import type { ActivityKind as DbActivityKind, PrismaClient } from "@prisma/client";
import {
  demoActivitiesFixture,
  demoClientsFixture,
  demoPostsFixture,
} from "../src/data/demoFixtures";

/**
 * Удаляет контент SMM (клиенты, посты, активность) и заливает демо из фикстур.
 * Старые id c1…/p1… заменяются на cuid; в Activity подставляются новые id.
 */
export async function seedDemoContentForUser(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.activity.deleteMany({ where: { userId } });
    await tx.post.deleteMany({ where: { userId } });
    await tx.client.deleteMany({ where: { userId } });

    const clientIdByOld = new Map<string, string>();
    const socialIdByOld = new Map<string, string>();

    for (const c of demoClientsFixture) {
      const created = await tx.client.create({
        data: {
          userId,
          fullName: c.fullName,
          activitySpheres: [...c.activitySpheres],
        },
      });
      clientIdByOld.set(c.id, created.id);

      const social = await tx.clientSocialAccount.create({
        data: {
          clientId: created.id,
          platform: "instagram",
          instagramUsername: c.instagramUsername,
        },
      });
      socialIdByOld.set(c.id, social.id);
    }

    const postIdByOld = new Map<string, string>();
    for (const p of demoPostsFixture) {
      const newSocialId = socialIdByOld.get(p.clientId);
      if (!newSocialId) continue;

      const created = await tx.post.create({
        data: {
          userId,
          clientSocialAccountId: newSocialId,
          status: p.status,
          postType: p.postType,
          caption: p.caption,
          location: p.location,
          firstComment: p.firstComment,
          altText: p.altText,
          imageUrls: p.imageUrls,
          publishDate: p.publishDate,
          publishTime: p.publishTime,
          createdAt: new Date(p.createdAt),
          clientReviewToken: p.clientReviewToken,
        },
      });
      postIdByOld.set(p.id, created.id);

      if (p.discussion?.length) {
        await tx.postReviewComment.createMany({
          data: p.discussion.map((d) => ({
            postId: created.id,
            side: d.side,
            text: d.text,
            createdAt: new Date(d.createdAt),
          })),
        });
      }
    }

    for (const a of demoActivitiesFixture) {
      await tx.activity.create({
        data: {
          userId,
          kind: a.kind as DbActivityKind,
          createdAt: new Date(a.createdAtMs),
          title: a.title,
          detail: a.detail ?? null,
          clientId: a.clientId ? clientIdByOld.get(a.clientId) ?? null : null,
          postId: a.postId ? postIdByOld.get(a.postId) ?? null : null,
        },
      });
    }
  });
}
