import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme";
import { PageErrorBoundary } from "@/lib/core/ErrorBoundary";
import { Toaster } from "sonner";
import { BackgroundBarWrapper } from "@/components/layout";
import { NavigationProvider } from "@/components/navigation/NavigationContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Search RAG",
  description: "Intelligent Document Processing and Web Crawling Platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="auto">
          <NavigationProvider>
            <BackgroundBarWrapper />
            {children}
            <Toaster position="top-right" />
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
