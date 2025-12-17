
import type { Metadata } from "next";
import { Poppins, PT_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import RouteGuard from "@/components/layout/RouteGuard";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '600', '700', '800'],
  variable: '--font-headline',
});
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
    <html lang="en">
      <body className={`${poppins.variable} ${ptSans.variable}`}>
        <FirebaseClientProvider>
          <AuthProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

    