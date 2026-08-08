"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { PageTitle } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { saveOnboarding } from "@/services/journal";
import type { Market, TraderStyle } from "@/types";

const styles: TraderStyle[] = ["Scalper", "Day trader", "Swing trader", "Position trader", "Investor"];
const markets: Market[] = ["Crypto", "Forex", "Futures", "Stocks", "Options"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [traderStyles, setTraderStyles] = useState<TraderStyle[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
  const [emailDigest, setEmailDigest] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<"Daily" | "Weekly">("Weekly");

  useEffect(() => {
    if (!profile) return;
    setTraderStyles(profile.traderStyles || []);
    setSelectedMarkets(profile.markets || []);
    setEmailDigest(profile.emailDigest || false);
    setEmailFrequency(profile.emailFrequency || "Weekly");
  }, [profile]);

  const toggle = <T,>(value: T, current: T[], setter: (next: T[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    setSaved(false);
    setError("");
  };

  const save = async () => {
    if (!user || !profile) return;
    if (!traderStyles.length || !selectedMarkets.length) {
      setError("Choose at least one trading style and one market.");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setError("");
      await saveOnboarding(user.uid, {
        traderStyles,
        markets: selectedMarkets,
        instruments: profile.instruments || [],
        experience: profile.experience,
        baseCurrency: profile.baseCurrency,
        goal: profile.goal,
        emailDigest,
        emailFrequency,
      });
      await refresh();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div className="loading"><span /></div>;

  return <div className="page">
    <PageTitle eyebrow="PERSONALIZATION" title="Trader profile" description="Control how Trade Tracker shapes your workspace." action={<button className="button" onClick={() => void save()} disabled={saving}>{saved ? <><Check /> Saved</> : saving ? "Saving…" : "Save changes"}</button>} />
    {error && <div className="notice">{error}</div>}
    <div className="profile-layout">
      <section className="profile-card identity-card"><div className="profile-avatar"><UserRound /></div><div><small>YOUR ACCOUNT</small><h2>{profile.name || "Trader"}</h2><p>{user?.email}</p></div><div className="profile-badges"><span><ShieldCheck /> Firebase protected</span><span><Sparkles /> Personalized</span></div></section>
      <section className="profile-card"><small>TRADING STYLE</small><h3>How you approach markets</h3><div className="profile-choices">{styles.map((style) => <button type="button" key={style} className={traderStyles.includes(style) ? "selected" : ""} onClick={() => toggle(style, traderStyles, setTraderStyles)}>{style}</button>)}</div></section>
      <section className="profile-card"><small>MARKETS</small><h3>What you track</h3><div className="profile-choices">{markets.map((market) => <button type="button" key={market} className={selectedMarkets.includes(market) ? "selected" : ""} onClick={() => toggle(market, selectedMarkets, setSelectedMarkets)}>{market}</button>)}</div><div className="profile-detail"><span>Favorite instruments</span><strong>{profile.instruments?.join(", ") || "Not set"}</strong></div><div className="profile-detail"><span>Primary goal</span><strong>{profile.goal}</strong></div></section>
      <section className="profile-card"><small>EMAIL PREFERENCES</small><h3>Market summaries</h3><label className="digest-toggle compact"><input type="checkbox" checked={emailDigest} onChange={(event) => { setEmailDigest(event.target.checked); setSaved(false); }} /><Mail /><span><strong>Receive an email digest</strong><small>Preference only until email delivery is connected.</small></span></label>{emailDigest && <label className="profile-select"><Bell /> Frequency<select value={emailFrequency} onChange={(event) => { setEmailFrequency(event.target.value as "Daily" | "Weekly"); setSaved(false); }}><option>Weekly</option><option>Daily</option></select></label>}</section>
    </div>
  </div>;
}
