import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nairika Labs Wi-Fi",
  description: "Connect to Wi-Fi and choose your internet plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}