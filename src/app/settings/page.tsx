"use client";
import { AuthGuard } from "@/components/auth/AuthGuard"; import { useAuth } from "@/components/auth/AuthProvider";
export default function Settings(){return <AuthGuard><Content/></AuthGuard>}
function Content(){const {user}=useAuth();return <main className="app-page"><div className="page-heading"><div><p className="eyebrow">Account</p><h1>Settings</h1></div></div><section className="card settings-card"><h2>Profile</h2><dl><div><dt>Display name</dt><dd>{user?.displayName||"Not set"}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div></dl><p className="muted">Profile editing and multiple trading accounts are intentionally outside Version 1.</p></section></main>}
