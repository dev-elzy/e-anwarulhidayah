import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { NativeBridgeProvider } from "@/components/native-bridge-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "e-AnwarulHidayah - Sistem Administrasi Pondok Pesantren",
  description: "Sistem Administrasi Pondok Pesantren Anwarul Hidayah",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "e-AnwarulHidayah",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#2196F3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof globalThis!=="undefined"&&!globalThis.__name){globalThis.__name=function(t,v){try{return Object.defineProperty(t,"name",{value:v,configurable:true})}catch(e){return t}}};if(typeof window!=="undefined"&&!window.__name){window.__name=globalThis.__name};`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased font-sans`}
      >
        <Providers>
          <NativeBridgeProvider>
            {children}
            <Toaster position="top-center" richColors />
          </NativeBridgeProvider>
        </Providers>
      </body>
    </html>
  );
}
