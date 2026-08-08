import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./dashboard.css";
import "./product.css";
import "./focus.css";
import { AuthProvider } from "@/lib/auth-context";
import { ProfileProvider } from "@/hooks/use-profile";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Trade Tracker — Trading Journal",
  description: "Record, review and refine your trading performance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <AuthProvider><ProfileProvider>{children}</ProfileProvider></AuthProvider>
      </body>
    </html>
  );
}
