import { Hex } from "viem";
import { BetEntity } from "../../bets/BetEntity";

export type CreateBetWebhookEvent = {
  webhookId: string;
  id: string;
  createdAt: string;
  type: "GRAPHQL";
  event: {
    data: {
      block: {
        hash: Hex;
        logs: {
          data: Hex;
          topics: Hex[];
          transaction: {
            hash: Hex;
            from: {
              address: Hex;
            };
            value: Hex;
            status: 1 | 2; // 1 is "confirmed"
          };
        }[];
      };
    };
  };
};

export type CreateBetContractEvent = {
  id: string;
  creator: Hex;
  creationTimestamp: bigint;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  duration: bigint;
  value: bigint;
  currency: Hex;
};

export type CreateBetSqsBody = Partial<BetEntity> & { duration: string | null };
