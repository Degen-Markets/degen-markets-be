import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

export type AcceptBetWebhookEvent = {
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

export type AcceptBetContractEvent = {
  id: UUID;
};

export interface AcceptBetSqsEvent extends SmartContractEventBody {
  id: UUID;
  acceptor: Hex;
  acceptanceTimestamp: number;
}

export interface AcceptBetSqsEvents extends SmartContractEvents {
  eventName: "BetAccepted";
  bets: AcceptBetSqsEvent[];
}
