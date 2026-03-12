import type { Metadata } from "next";
import { Geist, Syne, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MobileBlocker } from "@/components/layout/MobileBlocker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sky Insurance - Car Insurance Portal",
  description: "Operations and Sales Portal for Egyptian Car Insurance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        geistSans.variable,
        syne.variable,
        ibmMono.variable,
      )}
    >
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-teal-500/30 font-sans">
        <MobileBlocker />
        <div className="hidden md:block min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
