import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/auth/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "smmplaner",
  description: "SMM planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
