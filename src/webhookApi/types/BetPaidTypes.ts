import { WebhookEvent } from "./WebhookEventTypes";
import { UUID } from "crypto";
import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";

export type BetPaidWebhookEvent = WebhookEvent;

export type BetPaidContractEvent = {
  id: UUID;
};

export interface BetPaidSqsEvent extends SmartContractEventBody {
  txHash: Hex;
}

export interface BetPaidSqsEvents extends SmartContractEvents {
  eventName: "BetPaid";
  bets: BetPaidSqsEvent[];
}
