import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MainAppShell } from "@/components/sidebar/MainAppShell";

export default async function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainAppShell
      user={{
        email: session.user.email ?? null,
        name: session.user.name,
        image: session.user.image,
      }}
    >
      {children}
    </MainAppShell>
  );
}
