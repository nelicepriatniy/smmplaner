import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientDetailView } from "./ClientDetailView";
import { calendarAnchorFromPosts } from "@/domain/smm";
import { getServerRefMs } from "@/lib/serverRefMs";
import {
  getClientForUser,
  listClientsForUser,
  listPostsForUser,
  requireUserId,
} from "@/lib/smm-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const userId = await requireUserId();
  const client = await getClientForUser(userId, id);
  return {
    title: client
      ? `${client.fullName} — smmplaner`
      : "Клиент не найден",
    description: "Карточка клиента",
  };
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const client = await getClientForUser(userId, id);
  if (!client) notFound();

  const [allPosts, clients] = await Promise.all([
    listPostsForUser(userId),
    listClientsForUser(userId, refMs),
  ]);
  const clientPosts = allPosts.filter((p) => p.clientId === id);
  const anchor = calendarAnchorFromPosts(clientPosts);

  return (
    <ClientDetailView
      client={client}
      clientPosts={clientPosts}
      clients={clients}
      calendarDefaultYear={anchor.year}
      calendarDefaultMonthIndex={anchor.monthIndex}
    />
  );
}
