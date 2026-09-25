import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGRIVA — AI Agriculture Super App",
  description: "AI-powered agriculture intelligence, farm tools, content and marketplace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
