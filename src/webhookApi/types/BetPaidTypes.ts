import { WebhookEvent } from "./WebhookEventTypes";
import { UUID } from "crypto";
import { Hex } from "viem";
import { SmartContractEvents } from "../../smartContractEventProcessor/smartContractEventTypes";

export type BetPaidWebhookEvent = WebhookEvent;

export type BetPaidContractEvent = {
  id: UUID;
};

export type BetPaidSqsEvent = {
  id: UUID;
  txHash: Hex;
};

export interface BetPaidSqsEvents extends SmartContractEvents {
  eventName: "BetPaid";
  bets: BetPaidSqsEvent[];
}
