import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

export type BetCreatedWebhookEvent = {
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

export type BetCreatedContractEvent = {
  id: UUID;
  betType: string;
  creationTimestamp: bigint;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  strikePriceCreator: string;
  expirationTimestamp: bigint;
  value: bigint;
  currency: Hex;
};

export interface BetCreatedSqsEvent extends SmartContractEventBody {
  betType: string;
  creator: Hex;
  creationTimestamp: number;
  ticker: string;
  metric: string;
  isBetOnUp: boolean;
  expirationTimestamp: number;
  strikePriceCreator: string;
  value: number;
  currency: Hex;
}

export interface BetCreatedSqsEvents extends SmartContractEvents {
  eventName: "BetCreated";
  bets: BetCreatedSqsEvent[];
}
