import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";

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
      <body className="font-sans">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
