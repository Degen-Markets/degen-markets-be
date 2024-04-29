import { Hex } from "viem";

export type BetEntity = {
  id: string;
  creator: Hex;
  creationTimestamp: string;
  acceptor?: Hex;
  acceptanceTimestamp?: string;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: string;
  value: string;
  currency: string;
  startingMetricValue?: number;
  endingMetricValue?: number;
  winner: Hex;
  isWithdrawn: boolean;
};
