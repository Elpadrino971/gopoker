import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/common/Navigation";

export const metadata: Metadata = {
  title: "GPoker - Gestion de Poker",
  description: "Application de gestion de tournois, cash games et clubs de poker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
