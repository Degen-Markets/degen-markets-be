import { Hex } from "viem";
import { UUID } from "crypto";

export type BetEntity = {
  id: UUID;
  betType: string;
  creator: Hex;
  creationTimestamp: number;
  acceptor?: Hex;
  acceptanceTimestamp?: number;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: number;
  value: number;
  currency: string;
  startingMetricValue?: string;
  endingMetricValue?: string;
  winner?: Hex;
  winTimestamp?: number;
  isWithdrawn: boolean;
  isPaid: boolean;
  withdrawalTimestamp?: number;
  strikePriceCreator?: string | null;
  strikePriceAcceptor?: string | null;
};
