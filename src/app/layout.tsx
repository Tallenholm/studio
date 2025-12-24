import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import RouteGuard from "@/components/layout/RouteGuard";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: "Logan's Excavating",
  description: "Fleet & Operations Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${ptSans.variable}`}>
        <FirebaseClientProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
