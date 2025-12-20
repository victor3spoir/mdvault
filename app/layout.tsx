import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MDVault",
  description: "GitHub-powered Markdown content management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
