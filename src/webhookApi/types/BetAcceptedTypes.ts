import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

export type BetAcceptedWebhookEvent = {
  webhookId: string;
  id: string;
  createdAt: string;
  type: "GRAPHQL";
  event: {
    data: {
      block: {
        hash: Hex;
        timestamp: number;
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
