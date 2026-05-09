import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: "LegalSaathi — आफ्नो अधिकार जान्नुहोस्",
  description:
    "AI-powered legal assistant for Nepali citizens. Understand your rights, analyze documents, and get plain-language legal guidance in Nepali, Hindi, and English.",
  keywords: "Nepal law, legal assistant, AI, Nepali rights, legal document analyzer",
  authors: [{ name: "LegalSaathi" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "LegalSaathi — आफ्नो अधिकार जान्नुहोस्",
    description: "Know your legal rights in simple language.",
    images: ["/og-image.png"],
    type: "website",
    locale: "ne_NP",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ne" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${geist.variable} antialiased min-h-screen bg-background`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}