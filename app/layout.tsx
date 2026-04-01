import type { Metadata } from "next";

import "@/app/globals.css";
import { TimezoneSync } from "@/components/timezone-sync";

export const metadata: Metadata = {
  title: "Life Tracker",
  description: "Private habit tracking for gym, reading, and daily momentum."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TimezoneSync />
        {children}
      </body>
    </html>
  );
}
