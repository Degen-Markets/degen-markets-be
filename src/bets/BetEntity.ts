import { Hex } from "viem";
import { UUID } from "crypto";

export type BetEntity = {
  id: UUID;
  type: string;
  creator: Hex;
  creationTimestamp: number;
  acceptor: Hex | null;
  acceptanceTimestamp: number | null;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: number;
  value: number;
  currency: string;
  startingMetricValue: string | null;
  endingMetricValue: string | null;
  winner: Hex | null;
  winTimestamp: number | null;
  isWithdrawn: boolean;
  isPaid: boolean;
  withdrawalTimestamp: number | null;
  strikePriceCreator: string | null;
  strikePriceAcceptor: string | null;
  chain: string | null;
};
