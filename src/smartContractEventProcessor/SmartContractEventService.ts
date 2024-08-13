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
import * as PlayerService from "../players/PlayerService";
import { zeroAddress } from "viem";
import { tryItAsync } from "../utils/tryIt";

export class SmartContractEventService {
  private readonly logger = new Logger({
    serviceName: "SmartContractEventService",
  });

  private betService = new BetService();
  private quotesService = new QuotesService();
  private POINTS_PER_USD_FOR_ACCEPTED_BET = 8;
  private POINTS_PER_USD_FOR_WON_BET = 17;

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
      },
    );
    try {
      await this.betService.acceptV2Bets(finalBetAcceptedInfoArr);

      // increment points
      const ethUsdVal = Number(
        await this.quotesService.getLatestQuote(getCmcId("ETH"), "price"),
      );
      await Promise.all(
        finalBetAcceptedInfoArr.map(async (betAcceptedInfo) => {
          const { id: betId, acceptor } = betAcceptedInfo;
          const fullBetInfo = mapBetIdToFullInfo.get(betId);
          if (!fullBetInfo)
            throw new Error(`Bet info not available for id ${betId}`);

          const { creator, value, currency } = fullBetInfo;
          const betUsdVal =
            currency === zeroAddress ? ethUsdVal * value : value;
          const pointsToAward =
            Math.floor(betUsdVal) * this.POINTS_PER_USD_FOR_ACCEPTED_BET;

          const awardPointsTrial = await tryItAsync(() =>
            PlayerService.changePoints([creator, acceptor], pointsToAward),
          );
          if (!awardPointsTrial.success) {
            this.logger.error(
              `Couldn't award points for bet acceptance ${JSON.stringify({ betId })}`,
            );
            return;
          }

          this.logger.info(
            `Awarded points for bet acceptance ${JSON.stringify({ betId })}`,
          );
        }),
      );
    } catch (e) {
      this.logger.error(`Error inserting V2 Bet:`, e as Error);
    }
  };

  handleWithdrawBets = async (withdrawBetSqsEvents: BetWithdrawnSqsEvents) => {
    const betWithdrawnInfoArr = withdrawBetSqsEvents.bets;
    await this.betService.withdrawBets(betWithdrawnInfoArr);

    // decrement points
    const ethUsdVal = Number(
      await this.quotesService.getLatestQuote(getCmcId("ETH"), "price"),
    ); // ASK_ANGAD: Should we take the value of the bet when it was accepted instead of real time? Is there a field for the bet fiat value in the _bets_ table?
    const withdrawnBetIds = betWithdrawnInfoArr.map(({ id }) => id);
    const fullBetInfoArr = await this.betService.findMany(withdrawnBetIds);
    await Promise.all(
      fullBetInfoArr.map(async ({ winner, id: betId, value, currency }) => {
        if (!winner)
          throw new Error(
            `Withdrawn bet doesn't contain winner ${JSON.stringify({ betId })}`,
          );
        const betUsdVal = currency === zeroAddress ? ethUsdVal * value : value;
        const pointsToDetract =
          Math.floor(betUsdVal) * this.POINTS_PER_USD_FOR_ACCEPTED_BET;

        const detractPointsTrial = await tryItAsync(() =>
          PlayerService.changePoints([winner], -pointsToDetract),
        );
        if (!detractPointsTrial.success) {
          this.logger.error(
            `Couldn't detract points for bet withdrawn ${JSON.stringify({ betId })}`,
          );
          return;
        }

        this.logger.info(
          `Detracted points for bet withdrawn ${JSON.stringify({ betId })}`,
        );
      }),
    );
  };

  handlePayBets = async (betPaidSqsEvents: BetPaidSqsEvents) => {
    const betPaidInfoArr = betPaidSqsEvents.bets;
    await this.betService.payBets(betPaidInfoArr);

    // increment points
    const ethUsdVal = Number(
      await this.quotesService.getLatestQuote(getCmcId("ETH"), "price"),
    ); // ASK_ANGAD: Should we take the value of the bet when it was accepted instead of real time? Is there a field for the bet fiat value in the _bets_ table?
    const paidBetIds = betPaidInfoArr.map(({ id }) => id);
    const fullBetInfoArr = await this.betService.findMany(paidBetIds);
    await Promise.all(
      fullBetInfoArr.map(async ({ winner, id: betId, value, currency }) => {
        if (!winner)
          throw new Error(
            `Paid out bet doesn't contain winner ${JSON.stringify({ betId })}`,
          );
        const betUsdVal = currency === zeroAddress ? ethUsdVal * value : value;
        const pointsToAward =
          Math.floor(betUsdVal) * this.POINTS_PER_USD_FOR_WON_BET;

        const awardPointsTrial = await tryItAsync(() =>
          PlayerService.changePoints([winner], pointsToAward),
        );
        if (!awardPointsTrial.success) {
          this.logger.error(
            `Couldn't award points for bet paid out ${JSON.stringify({ betId })}`,
          );
          return;
        }

        this.logger.info(
          `Awarded points for bet paid out ${JSON.stringify({ betId })}`,
        );
      }),
    );
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
