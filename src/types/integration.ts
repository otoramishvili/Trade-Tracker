import type { Timestamp } from "firebase/firestore";
import type { TradeDraft } from "./trade";

export type ConnectorId = "tradovate" | "rithmic" | "projectx" | "metatrader5" | "ctrader" | "tradelocker" | "matchtrader" | "dxtrade" | "wealthcharts" | "csv";
export type ConnectionEnvironment = "demo" | "live";
export type ConnectionStatus = "connected" | "needs_token" | "error";

export interface TradingConnection {
  id: string;
  firmId: string;
  firmName: string;
  connector: ConnectorId;
  platformName: string;
  environment: ConnectionEnvironment;
  externalAccountId: string;
  accountName: string;
  status: ConnectionStatus;
  lastSyncedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ConnectionDraft = Omit<TradingConnection, "id" | "createdAt" | "updatedAt" | "lastSyncedAt">;

export interface ImportedTrade extends TradeDraft {
  source: "imported";
  provider: ConnectorId;
  connectionId: string;
  externalTradeId: string;
  externalAccountId: string;
  importedAt?: string;
}

export interface DiscoveredAccount {
  id: string;
  name: string;
  active: boolean;
}

export type SyncResponse = {
  accounts: DiscoveredAccount[];
  trades: ImportedTrade[];
};
