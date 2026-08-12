"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TradingAccountProvider } from "@/components/accounts/TradingAccountProvider";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "./AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <main className="center-state"><span className="loader" />Checking your session…</main>;
  return <TradingAccountProvider><AppShell>{children}</AppShell></TradingAccountProvider>;
}
