import { zeroAddress } from "viem";
import { BetEntity } from "../../bets/BetEntity";
import { QuotesService } from "../../quotes/QuotesService";
import { getCmcId } from "../../utils/cmcApi";
import { tryItAsync } from "../../utils/tryIt";
import * as PlayerService from "../../players/PlayerService";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "awardWinPoints" });

export const awardWinPoints = async (
  bets: BetEntity[],
  pointPerUsdForWonBet: number,
) => {
  const ethUsdVal = Number(
    new QuotesService().getLatestQuote(getCmcId("ETH"), "price"),
  );
  const winPointAwardAttemptsArr = await Promise.all(
    bets
      .map((bet) => {
        if (!bet.winner)
          throw new Error(
            `Bet doesn't have a winner set in database ${JSON.stringify({ bet })}`,
          );

        const betUsdVal =
          bet.currency === zeroAddress ? bet.value * ethUsdVal : bet.value;
        return { address: bet.winner, betUsdVal, betId: bet.id };
      })
      .map(async ({ address, betUsdVal, betId }) => {
        const pointsToAward = Math.floor(betUsdVal) * pointPerUsdForWonBet;
        const awardWinPointsTrial = await tryItAsync(() =>
          PlayerService.changePoints([address], pointsToAward),
        );
        if (!awardWinPointsTrial.success) {
          return { success: false, betId };
        }
        return { success: true, betId };
      }),
  );
  const [successfulAwards, failedAwards] = winPointAwardAttemptsArr.reduce<
    [string[], string[]]
  >(
    ([successList, failList], { success, betId }) => {
      if (success) return [successList.concat(betId), failList];
      else return [successList, failList.concat(betId)];
    },
    [[], []],
  );
  if (successfulAwards.length)
    logger.info(
      `Awarded win points for the following betIds [${successfulAwards.join(", ")}]`,
    );
  if (failedAwards.length)
    logger.error(
      `Couldn't award win points for the following betIds [${failedAwards.join(", ")}]`,
    );
};
