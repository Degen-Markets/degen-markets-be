import { Hex } from "viem";
import { UUID } from "crypto";

export type BetEntity = {
  id: UUID;
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
