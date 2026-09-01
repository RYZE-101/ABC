import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DROP / RANK",
  description: "Play Plinko. Rank profiles.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
