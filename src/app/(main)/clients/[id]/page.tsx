import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientById, getPostDraftsByClientId } from "@/data/mockDb";
import { ClientDetailView } from "./ClientDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const client = getClientById(id);
  return {
    title: client
      ? `${client.fullName} — smmplaner`
      : "Клиент не найден",
    description: "Карточка клиента",
  };
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;
  const client = getClientById(id);
  if (!client) notFound();

  return (
    <ClientDetailView
      client={client}
      clientPosts={getPostDraftsByClientId(id)}
    />
  );
}
