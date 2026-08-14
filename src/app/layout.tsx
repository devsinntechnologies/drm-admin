import React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import StaffRealtimeProvider from "@/components/providers/StaffRealtimeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "DigiNizam Admin",
  description: "Enterprise multi-industry business operating system — platform administration",
  icons: {
    icon: "/logo-mark.png",
    shortcut: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.variable} suppressHydrationWarning>
        <ReduxProvider>
          <StaffRealtimeProvider>{children}</StaffRealtimeProvider>
        </ReduxProvider>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          theme="light"
          toastOptions={{
            style: {
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            },
            className: 'premium-toast',
          }}
        />
      </body>
    </html>
  );
}
