"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, CalendarDays, LayoutDashboard, LogOut, Menu, Plus, UserRound, WalletCards, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/use-profile";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/trades", label: "Trades", icon: BarChart3 },
  { href: "/dashboard/portfolio", label: "Paper portfolio", icon: BriefcaseBusiness },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/accounts", label: "Accounts", icon: WalletCards },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  useEffect(() => { if (!profileLoading && !profileError && user && !profile?.onboardingComplete) router.replace("/onboarding"); }, [profileLoading, profileError, profile, user, router]);
  if (profileError) return <main className="onboarding-page"><div className="onboarding-card"><div className="onboarding-heading"><small>FIRESTORE SETUP REQUIRED</small><h1>Your database is denying access.</h1><p>Authentication worked, but the Firestore security rules have not been published for this app. Open Firebase Console, select Firestore Database, open the Rules tab, paste the project&apos;s <code>firestore.rules</code>, and click Publish.</p></div><button className="button" onClick={() => window.location.reload()}>Try again</button></div></main>;
  if (loading || profileLoading || !user || !profile?.onboardingComplete) return <div className="loading"><span /></div>;
  const email = user.email || "trader@tradetracker.app";
  const hasPositionWorkflow = profile.traderStyles?.some((style) => style === "Investor" || style === "Position trader");
  const visibleLinks = links.filter((item) => item.href !== "/dashboard/portfolio" || hasPositionWorkflow);
  return <div className="app-shell"><aside className={open ? "open" : ""}><div className="aside-head"><Link href="/" className="brand"><span>TT</span> Trade Tracker</Link><button onClick={() => setOpen(false)}><X /></button></div><nav>{visibleLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={path === href ? "active" : ""}><Icon />{label}</Link>)}</nav><div className="account-chip"><div>{email.slice(0, 2).toUpperCase()}</div><span><strong>{profile.name||email.split("@")[0]}</strong><small>{profile.traderStyles?.[0]||email}</small></span><button onClick={() => logout()} title="Log out"><LogOut /></button></div></aside><main className="workspace"><header><button className="mobile-menu" onClick={() => setOpen(true)}><Menu /></button><div><p>{profile.markets?.join(" · ")||"TRADING JOURNAL"}</p><h1>{visibleLinks.find((item) => item.href === path)?.label || "Overview"}</h1></div><Link href="/dashboard/trades?new=1" className="button small"><Plus /> Log trade</Link></header>{children}</main></div>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-title"><div><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof BarChart3; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty"><Icon /><h3>{title}</h3><p>{text}</p>{action}</div>;
}
