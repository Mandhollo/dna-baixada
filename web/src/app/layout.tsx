import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A2463",
};

export const metadata: Metadata = {
  title: {
    default: "DNA Baixada — Mobilidade, Turismo e Impacto Social",
    template: "%s | DNA Baixada",
  },
  description:
    "Plataforma regional de mobilidade, turismo e impacto social na Baixada Santista. Corridas, city tours, transfer e turismo em Santos, Guarujá, São Vicente e toda a Baixada.",
  keywords: [
    "DNA Baixada", "transporte Santos", "city tour Santos", "transfer Guarulhos",
    "corrida Santos", "turismo Baixada Santista", "mobilidade Santos",
    "transfer aeroporto Santos", "passeio turístico Santos", "Guarujá",
    "São Vicente", "Baixada Santista", "transporte executivo",
  ],
  authors: [{ name: "DNA Baixada" }],
  creator: "DNA Baixada",
  publisher: "DNA Baixada",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "DNA Baixada",
    title: "DNA Baixada — Mobilidade, Turismo e Impacto Social",
    description: "Corridas, city tours, transfer e turismo na Baixada Santista. Cada corrida transforma vidas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DNA Baixada — Mobilidade, Turismo e Impacto Social",
    description: "Corridas, city tours, transfer e turismo na Baixada Santista.",
  },
  alternates: { canonical: "https://dnabaixada.com.br" },
  metadataBase: new URL("https://dnabaixada.com.br"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
