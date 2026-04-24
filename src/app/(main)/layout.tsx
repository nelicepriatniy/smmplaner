import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/AppSidebar";

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
    <div className="min-h-dvh">
      <AppSidebar
        user={{
          email: session.user.email ?? null,
          name: session.user.name,
          image: session.user.image,
        }}
      />
      <div className="box-border ml-[260px] flex min-h-dvh min-w-0 w-[calc(100%-260px)] flex-col px-5 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
