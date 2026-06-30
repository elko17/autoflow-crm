import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AutoFlow CRM",
  description: "CRM System for Auto Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
          <Toaster position="bottom-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
