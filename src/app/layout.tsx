import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Restaurant Manager Admin",
  description: "Restaurant manager super admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <ReduxProvider>{children}</ReduxProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
