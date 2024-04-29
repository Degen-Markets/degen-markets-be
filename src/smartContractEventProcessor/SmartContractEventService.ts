import { Logger } from "@aws-lambda-powertools/logger";
import {
  isAcceptBetSqsEvent,
  isCreateBetSqsEvent,
  SmartContractEvents,
} from "./smartContractEventTypes";
import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";
import { BetService } from "../bets/BetService";
import { AcceptBetSqsEvents } from "../webhookApi/types/AcceptBetTypes";

export class SmartContractEventService {
  private readonly logger = new Logger({
    serviceName: "SmartContractEventService",
  });

  private betService = new BetService();
  handleCreateBets = async (createBetSqsEvents: CreateBetSqsEvents) => {
    await this.betService.createBets(
      createBetSqsEvents.bets.map((bet) => ({
        ...bet,
        expirationTimestamp: String(Date.now() + Number(bet.duration)),
      })),
    );
  };

  handleAcceptBets = async (acceptBetSqsEvents: AcceptBetSqsEvents) => {
    await this.betService.updateBets(acceptBetSqsEvents.bets);
  };

  handleSmartContractEvents = async (
    smartContractEvents: SmartContractEvents,
  ) => {
    this.logger.info(
      `handling ${smartContractEvents.bets.length} ${smartContractEvents.eventName} contract event(s)`,
    );
    if (isCreateBetSqsEvent(smartContractEvents)) {
      await this.handleCreateBets(smartContractEvents);
    } else if (isAcceptBetSqsEvent(smartContractEvents)) {
      await this.handleAcceptBets(smartContractEvents);
    }
  };
}
