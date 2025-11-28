import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Textskanner",
  description: "Dagboksskanner, avtalsanalys och språkverktyg i samma plattform."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv" className="bg-[#F5F7FA] text-[#111111]">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
