"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { logoutUser } from "@/lib/firebase/auth";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";

const links = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/trades", label: "Trade journal", icon: "book" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/connections", label: "Connections", icon: "grid" },
  { href: "/coach", label: "AI coach", icon: "grid" },
  { href: "/trades/new", label: "Add trade", icon: "plus" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccount, loading: accountsLoading, selectAccount } = useTradingAccounts();
  const [open, setOpen] = useState(false);

  const active = (href: string) => href === "/trades" ? pathname === href || (/^\/trades\/.+/.test(pathname) && pathname !== "/trades/new") : pathname === href;

  return <div className="shell">
    <div className={`sidebar-scrim ${open ? "visible" : ""}`} onClick={() => setOpen(false)} />
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand"><span className="brand-mark">JT</span><div><b>Journal Trade</b><small>Performance journal</small></div></div>
      <div className="account-switcher"><label htmlFor="active-trading-account">Active account</label><select id="active-trading-account" value={activeAccount} disabled={accountsLoading} onChange={event => void selectAccount(event.target.value)}><option value="">All accounts</option>{accounts.map(account => <option value={account} key={account}>{account}</option>)}</select><Link href="/settings#trading-accounts" onClick={() => setOpen(false)}>Manage accounts</Link></div>
      <nav className="sidebar-nav" aria-label="Application navigation">
        <p>Workspace</p>
        {links.filter(link => link.href !== "/trades/new" || accounts.length > 0).map(link => <Link key={link.href} href={link.href} className={active(link.href) ? "active" : ""} onClick={() => setOpen(false)}><Icon name={link.icon}/><span>{link.label}</span>{link.href === "/trades/new" && <kbd>N</kbd>}</Link>)}
      </nav>
      <div className="sidebar-note"><span>Private by default</span><p>Your trades are secured inside your Firebase account.</p></div>
      <div className="sidebar-user"><div className="avatar">{(user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}</div><div className="user-copy"><b>{user?.displayName || "Trader"}</b><small>{user?.email}</small></div><button aria-label="Log out" title="Log out" onClick={async()=>{await logoutUser();router.push("/")}}><Icon name="logout"/></button></div>
    </aside>
    <div className="shell-main">
      <header className="mobile-bar"><button aria-label="Open navigation" onClick={() => setOpen(true)}><Icon name="menu"/></button><Link href="/dashboard"><span className="brand-mark">JT</span> Journal Trade</Link>{accounts.length > 0 ? <Link className="mobile-add" href="/trades/new">+</Link> : <Link className="mobile-add" href="/settings#trading-accounts">◇</Link>}</header>
      {children}
    </div>
  </div>;
}

function Icon({name}:{name:string}) { const paths:Record<string,React.ReactNode>={grid:<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h6"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,plus:<><path d="M12 5v14M5 12h14"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.05 7.03 4.2l.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2l2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10h.08v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,logout:<><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>};return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>}
