import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";
import { WebhookEvent } from "./WebhookEventTypes";

export type BetCreatedWebhookEvent = {
  webhookId: WebhookEvent["webhookId"];
  event: {
    data: {
      block: Omit<WebhookEvent["event"]["data"]["block"], "timestamp">;
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
  chain: string;
}

export interface BetCreatedSqsEvents extends SmartContractEvents {
  eventName: "BetCreated";
  bets: BetCreatedSqsEvent[];
}
