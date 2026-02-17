import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Go Fly a Kite",
  description: "Get an alert when tomorrow's wind conditions are perfect for kiting.",
  openGraph: {
    title: "Go Fly a Kite",
    description: "Get an alert when tomorrow's wind conditions are perfect for kiting.",
    images: [{ url: "/kite-1.png", width: 800, alt: "Kite" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Go Fly a Kite",
    description: "Get an alert when tomorrow's wind conditions are perfect for kiting.",
    images: ["/kite-1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
