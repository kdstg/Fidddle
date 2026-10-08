import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure Alkaline Test local font family mapping all weight files
const alkalineTest = localFont({
  src: [
    {
      path: "../../public/fonts/AlkalineTest-Regular-BF676e1b6ca889c.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/AlkalineTest-Medium-BF676e1b6c9ed61.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/AlkalineTest-Demi-BF676e1b6c71ac3.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/AlkalineTest-Bold-BF676e1b6c6a873.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/AlkalineTest-Heavy-BF676e1b6c999cd.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-alkaline-test",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fidddle — Zero-Trail E-Signatures",
  description: "Send, sign, and seal agreements in seconds. Simple and Secure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${alkalineTest.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#202020] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}