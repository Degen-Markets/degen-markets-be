export type BetEntity = {
  id: string;
  creator: string;
  creationTimestamp: string;
  acceptor: string;
  acceptanceTimestamp: string;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expiresAt: string;
  value: string;
  currency: string;
  startingMetricValue: string;
  endingMetricValue: string;
  winner: string;
}