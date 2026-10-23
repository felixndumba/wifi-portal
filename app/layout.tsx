
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nairika Labs | Paid Wi-Fi",
  description: "Purchase affordable Wi-Fi access using M-Pesa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-gray-100 min-h-screen`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
