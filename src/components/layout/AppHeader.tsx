"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
export function AppHeader(){const pathname=usePathname();if(!["/","/login","/register"].includes(pathname))return null;return <header className="header"><Link className="brand" href="/"><span>JT</span><div>Journal Trade<small>Trade with context</small></div></Link><nav aria-label="Main navigation"><Link href="/#how">How it works</Link><Link href="/login">Log in</Link><Link className="button small" href="/register">Start journaling</Link></nav></header>}
