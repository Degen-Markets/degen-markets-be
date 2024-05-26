import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";
import { WebhookEvent } from "./WebhookEventTypes";

export type BetAcceptedWebhookEvent = WebhookEvent;

export type BetAcceptedContractEvent = {
  id: UUID;
  strikePriceAcceptor: string;
};

export interface BetAcceptedSqsEvent extends SmartContractEventBody {
  id: UUID;
  acceptor: Hex;
  acceptanceTimestamp: number;
  strikePriceAcceptor: string;
}

export interface BetAcceptedSqsEvents extends SmartContractEvents {
  eventName: "BetAccepted";
  bets: BetAcceptedSqsEvent[];
}
