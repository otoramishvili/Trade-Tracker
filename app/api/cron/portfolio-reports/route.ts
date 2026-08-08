import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getCryptoPrices } from "@/lib/coingecko";
import type { Account, PaperPosition, UserProfile } from "@/types";

export const maxDuration = 60;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
const money = (value: number) => `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function sendReport(uid: string, profile: UserProfile) {
  const db = getAdminDb();
  const [positionSnapshot, accountSnapshot] = await Promise.all([
    db.collection("paperPositions").where("userId", "==", uid).get(),
    db.collection("accounts").where("userId", "==", uid).get(),
  ]);
  const positions = positionSnapshot.docs.map((document) => ({ id: document.id, ...document.data() } as PaperPosition));
  const accounts = accountSnapshot.docs.map((document) => ({ id: document.id, ...document.data() } as Account));
  if (!positions.length || !profile.email) return "skipped" as const;

  const cryptoSymbols = positions.filter((position) => position.market === "Crypto").map((position) => position.symbol);
  const { prices } = await getCryptoPrices(cryptoSymbols);
  const rows = positions.map((position) => {
    const currentPrice = position.market === "Crypto" ? prices[position.symbol.toUpperCase()]?.price ?? position.currentPrice : position.currentPrice;
    const multiplier = position.direction === "Long" ? 1 : -1;
    const pnl = (currentPrice - position.entryPrice) * position.quantity * multiplier;
    const notional = position.entryPrice * position.quantity;
    return { position, currentPrice, pnl, notional, margin: notional / position.leverage };
  });
  const startingBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const pnl = rows.reduce((sum, row) => sum + row.pnl, 0);
  const exposure = rows.reduce((sum, row) => sum + row.notional, 0);
  const margin = rows.reduce((sum, row) => sum + row.margin, 0);
  const equity = startingBalance + pnl;
  const availableMargin = equity - margin;
  const holdings = rows.map(({ position, currentPrice, pnl: positionPnl }) => `<tr><td style="padding:8px;border-bottom:1px solid #dfe7e4">${escapeHtml(position.symbol)}</td><td style="padding:8px;border-bottom:1px solid #dfe7e4">${escapeHtml(position.direction)}</td><td style="padding:8px;border-bottom:1px solid #dfe7e4">${money(currentPrice)}</td><td style="padding:8px;border-bottom:1px solid #dfe7e4;color:${positionPnl >= 0 ? "#087f5b" : "#c92a2a"}">${money(positionPnl)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#10211c;max-width:640px;margin:auto"><h1>Trade Tracker portfolio update</h1><p>Hello ${escapeHtml(profile.name || "Trader")}, here is your scheduled portfolio summary.</p><div style="background:#eef8f4;padding:18px;border-radius:12px"><p><strong>Portfolio equity:</strong> ${money(equity)}</p><p><strong>Available margin:</strong> ${money(availableMargin)}</p><p><strong>Total exposure:</strong> ${money(exposure)}</p><p><strong>Unrealized P/L:</strong> ${money(pnl)}</p></div><h2>Open positions</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Asset</th><th align="left">Side</th><th align="left">Price</th><th align="left">P/L</th></tr></thead><tbody>${holdings}</tbody></table><p style="font-size:12px;color:#687b74;margin-top:24px">Prices are market estimates from CoinGecko. This is a paper portfolio summary, not financial advice.</p></div>`;
  const period = `${new Date().toISOString().slice(0, 10)}-${new Date().getUTCHours() < 12 ? "am" : "pm"}`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json", "Idempotency-Key": `portfolio-${uid}-${period}` }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [profile.email], subject: `Portfolio update · ${money(equity)}`, html }) });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
  return "sent" as const;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return NextResponse.json({ error: "Resend environment variables are incomplete" }, { status: 500 });
  try {
    const users = await getAdminDb().collection("users").where("emailDigest", "==", true).get();
    const now = new Date();
    const eligible = users.docs.filter((document) => {
      const profile = document.data() as UserProfile;
      const portfolioTrader = profile.traderStyles?.some((style) => style === "Investor" || style === "Position trader");
      const due = profile.emailFrequency === "Every 12 hours" || (profile.emailFrequency === "Daily" && now.getUTCHours() === 0) || (profile.emailFrequency === "Weekly" && now.getUTCDay() === 0 && now.getUTCHours() === 0);
      return portfolioTrader && due;
    });
    const results = await Promise.allSettled(eligible.map((document) => sendReport(document.id, document.data() as UserProfile)));
    const sent = results.filter((result) => result.status === "fulfilled" && result.value === "sent").length;
    const skipped = results.filter((result) => result.status === "fulfilled" && result.value === "skipped").length;
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({ success: true, eligible: eligible.length, sent, skipped, failed });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Portfolio reports failed" }, { status: 500 });
  }
}
