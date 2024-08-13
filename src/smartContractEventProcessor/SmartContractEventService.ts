import { Logger } from "@aws-lambda-powertools/logger";
import {
  isAcceptBetSqsEvent,
  isBetPaidSqsEvent,
  isCreateBetSqsEvent,
  isWithdrawBetSqsEvent,
  SmartContractEvents,
} from "./smartContractEventTypes";
import { BetCreatedSqsEvents } from "../webhookApi/types/BetCreatedTypes";
import { BetService } from "../bets/BetService";
import { BetAcceptedSqsEvents } from "../webhookApi/types/BetAcceptedTypes";
import { BetWithdrawnSqsEvents } from "../webhookApi/types/BetWithdrawnTypes";
import { QuotesService } from "../quotes/QuotesService";
import { getCmcId } from "../utils/cmcApi";
import { BetPaidSqsEvents } from "../webhookApi/types/BetPaidTypes";

export class SmartContractEventService {
  private readonly logger = new Logger({
    serviceName: "SmartContractEventService",
  });

  private betService = new BetService();
  private quotesService = new QuotesService();
  handleCreateBets = async (createBetSqsEvents: BetCreatedSqsEvents) => {
    try {
      await this.betService.createV2Bets(createBetSqsEvents.bets);
    } catch (e) {
      this.logger.error(`Error inserting V2 Bet:`, e as Error);
    }
  };

  handleAcceptBets = async (acceptBetSqsEvents: BetAcceptedSqsEvents) => {
    const sqsBetAcceptedInfoArr = acceptBetSqsEvents.bets;
    const acceptedBetIds = sqsBetAcceptedInfoArr.map(({ id }) => id);
    const acceptedBets = await this.betService.findMany(acceptedBetIds);
    const mapBetIdToFullInfo = new Map(
      acceptedBets.map((bet) => [bet.id, bet]),
    );
    const setOfUniqueTickersInBets = [
      ...new Set(acceptedBets.map(({ ticker }) => ticker)).values(),
    ];

    const mapTickerToLatestMetrics = new Map(
      await Promise.all(
        setOfUniqueTickersInBets.map(
          async (ticker) =>
            [
              ticker,
              await this.quotesService.getLatestMetrics(getCmcId(ticker)),
            ] as const,
        ),
      ),
    );

    const finalBetAcceptedInfoArr = sqsBetAcceptedInfoArr.map(
      (betAcceptedInfo) => {
        const betFullInfo = mapBetIdToFullInfo.get(betAcceptedInfo.id);
        if (!betFullInfo)
          throw new Error(
            `Bet info not available for id ${betAcceptedInfo.id}`,
          );

        const ticker = betFullInfo.ticker;
        const metrics = mapTickerToLatestMetrics.get(ticker);
        if (!metrics)
          throw new Error(`Metrics not available for ticker=${ticker}`);
        return {
          ...betAcceptedInfo,
          startingMetricValue: String(
            metrics[
              betFullInfo.metric as keyof typeof metrics /* TODO: Make this typesafe */
            ],
          ),
        };
      });
    try {
      await this.betService.acceptV2Bets(finalBetAcceptedInfoArr);
    } catch (e) {
      this.logger.error(`Error inserting V2 Bet:`, e as Error);
    }
  };

  handleWithdrawBets = async (withdrawBetSqsEvents: BetWithdrawnSqsEvents) => {
    await this.betService.withdrawBets(withdrawBetSqsEvents.bets);
  };

  handlePayBets = async (betPaidSqsEvents: BetPaidSqsEvents) => {
    await this.betService.payBets(betPaidSqsEvents.bets);
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
    } else if (isWithdrawBetSqsEvent(smartContractEvents)) {
      await this.handleWithdrawBets(smartContractEvents);
    } else if (isBetPaidSqsEvent(smartContractEvents)) {
      await this.handlePayBets(smartContractEvents);
    }
  };
}
