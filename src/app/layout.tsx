import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sussy — One phone. All the games.",
  description:
    "The ultimate pass-and-play party game. Imposter, Hot Takes, Truth or Dare — no Wi-Fi needed.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sussy",
  },
  openGraph: {
    title: "Sussy — One phone. All the games.",
    description:
      "The ultimate pass-and-play party game. No Wi-Fi, no second devices, no accounts.",
    type: "website",
    siteName: "Sussy",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Sussy" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
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
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
