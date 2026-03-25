import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "Calendário de Eventos Lagoinha Alphaville";
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (settings && settings.siteTitle) title = settings.siteTitle;
  } catch (e) {}

  return {
    title,
    description: "Plataforma de gestão de escalas e calendário",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let primaryColor = "#1e3a8a";
  let accentColor = "#f59e0b";
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (settings) {
      primaryColor = settings.primaryColor;
      accentColor = settings.accentColor;
    }
  } catch (e) {}

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary: ${primaryColor} !important;
            --accent: ${accentColor} !important;
          }
        `}} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
