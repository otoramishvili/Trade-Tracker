export type LiveCryptoPrice = { price: number; change24h: number | null; updatedAt: number | null };

const coinIds: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin",
  XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", AVAX: "avalanche-2",
  DOT: "polkadot", LINK: "chainlink", LTC: "litecoin", BCH: "bitcoin-cash",
  UNI: "uniswap", AAVE: "aave", SUI: "sui", TON: "the-open-network",
  TRX: "tron", USDT: "tether", USDC: "usd-coin", SHIB: "shiba-inu",
};

export const isSupportedCryptoSymbol = (symbol: string) => Boolean(coinIds[symbol.trim().toUpperCase()]);

type CoinGeckoPrice = { usd?: number; usd_24h_change?: number; last_updated_at?: number };

export async function getCryptoPrices(input: string[]) {
  const symbols = [...new Set(input.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  const supported = symbols.filter((symbol) => coinIds[symbol]);
  const unsupported = symbols.filter((symbol) => !coinIds[symbol]);
  if (!supported.length) return { prices: {} as Record<string, LiveCryptoPrice>, unsupported };

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", supported.map((symbol) => coinIds[symbol]).join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_last_updated_at", "true");
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.COINGECKO_DEMO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_DEMO_API_KEY;

  const response = await fetch(url, { headers, next: { revalidate: 20 } });
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const payload = await response.json() as Record<string, CoinGeckoPrice>;
  const prices = Object.fromEntries(supported.flatMap((symbol) => {
    const value = payload[coinIds[symbol]];
    return typeof value?.usd === "number" ? [[symbol, { price: value.usd, change24h: value.usd_24h_change ?? null, updatedAt: value.last_updated_at ?? null }]] : [];
  })) as Record<string, LiveCryptoPrice>;
  return { prices, unsupported };
}
