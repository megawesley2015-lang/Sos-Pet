import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import EmergencyFAB from "@/components/ui/EmergencyFAB";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getBaseUrl } from "@/lib/utils/url";
import { themeScript } from "@/lib/theme-script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SOS Pet Aumigo — Achados & Perdidos",
    template: "%s · SOS Pet Aumigo",
  },
  description:
    "Rede colaborativa de resgate. Cadastre seu pet perdido, dispare um SOS e conte com a rede pra trazer ele de volta.",
  metadataBase: new URL(getBaseUrl()),
  applicationName: "SOS Pet Aumigo",
  authors: [{ name: "SOS Pet Aumigo" }],
  keywords: [
    "pet perdido",
    "pet encontrado",
    "achados e perdidos",
    "resgate",
    "cachorro perdido",
    "gato perdido",
    "veterinário",
  ],
  openGraph: {
    title: "SOS Pet Aumigo — Achados & Perdidos",
    description:
      "Rede colaborativa de resgate. Cadastre, busque e ajude a reencontrar pets.",
    type: "website",
    locale: "pt_BR",
    siteName: "SOS Pet Aumigo",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOS Pet Aumigo — Achados & Perdidos",
    description:
      "Rede colaborativa de resgate. Cadastre, busque e ajude a reencontrar pets.",
  },
  appleWebApp: {
    capable: true,
    title: "SOS Pet Aumigo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121214" },
    { media: "(prefers-color-scheme: light)", color: "#FFF8EE" }, // warm light bg
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <EmergencyFAB />
        <PWAInstaller />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
