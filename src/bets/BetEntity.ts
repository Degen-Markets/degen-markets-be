import { Hex } from "viem";
import { UUID } from "crypto";

export type BetEntity = {
  id: UUID;
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
  startingMetricValue?: number;
  endingMetricValue?: number;
  winner?: Hex;
  isWithdrawn: boolean;
  withdrawalTimestamp?: number;
};
