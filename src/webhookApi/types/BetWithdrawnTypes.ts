import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";
import { WebhookEvent } from "./WebhookEventTypes";

export type BetWithdrawnWebhookEvent = WebhookEvent;

export type BetWithdrawnContractEvent = {
  id: UUID;
};

export interface BetWithdrawnSqsEvent extends SmartContractEventBody {
  withdrawalTimestamp: number;
  txHash: string;
}

export interface BetWithdrawnSqsEvents extends SmartContractEvents {
  eventName: "BetWithdrawn";
  bets: BetWithdrawnSqsEvent[];
}
