import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Textscanner",
  description: "Dagboksscannern, Avtalsscannern, SläktMagi och Minnesböcker i samma plattform."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv" className="bg-[#F5F7FA] text-[#111111]">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
