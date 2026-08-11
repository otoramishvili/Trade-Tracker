import type { Metadata } from "next"; import "./globals.css"; import { AuthProvider } from "@/components/auth/AuthProvider"; import { AppHeader } from "@/components/layout/AppHeader";
export const metadata:Metadata={title:"Journal Trade",description:"A focused journal for reviewing trading performance."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><AuthProvider><AppHeader/>{children}</AuthProvider></body></html>}
