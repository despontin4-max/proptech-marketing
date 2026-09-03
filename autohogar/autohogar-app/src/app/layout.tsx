import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoHogar | Panel de Cobranzas",
  description: "Plataforma interna de gestión de cobranzas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
