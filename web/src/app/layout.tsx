import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import InstallBanner from "@/components/pwa/InstallBanner";
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
  metadataBase: new URL("https://dna-baixada.vercel.app"),
  openGraph: {
    title: "DNA Baixada — Mobilidade, Turismo e Impacto Social",
    description: "Plataforma regional de mobilidade, turismo e impacto social na Baixada Santista.",
    url: "https://dna-baixada.vercel.app",
    siteName: "DNA Baixada",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DNA Baixada" }],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "DNA Baixada — Mobilidade, Turismo e Impacto Social",
    description: "Plataforma regional de mobilidade, turismo e impacto social na Baixada Santista.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DNA Baixada",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "https://dna-baixada.vercel.app" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <InstallBanner />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
