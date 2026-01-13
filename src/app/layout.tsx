import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MonitorInit from "@/components/MonitorInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Frontend Monitor",
  description: "Real-time performance monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MonitorInit />
        {children}
      </body>
    </html>
  );
}
