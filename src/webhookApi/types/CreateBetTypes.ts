import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

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
  id: UUID;
  creator: Hex;
  creationTimestamp: bigint;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: bigint;
  value: bigint;
  currency: Hex;
};

export interface CreateBetSqsEvent extends SmartContractEventBody {
  creator: Hex;
  creationTimestamp: number;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: number;
  value: number;
  currency: Hex;
}

export interface CreateBetSqsEvents extends SmartContractEvents {
  eventName: "BetCreated";
  bets: CreateBetSqsEvent[];
}
