import type { Metadata } from "next";
import React from "react";

import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { AppStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "C.Route — Career Navigation Loop",
  description: "Your career. Your route. Your next move. Real market data. Explainable routes. A 90-day plan that moves you forward.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col bg-brand-bg text-brand-text font-body selection:bg-brand-green/20 selection:text-brand-green">
        <AppStoreProvider>
          <NavBar />
          <main className="flex flex-1 flex-col relative">{children}</main>
        </AppStoreProvider>
      </body>
    </html>
  );
}
