import { zeroAddress } from "viem";
import { BetEntity } from "../../bets/BetEntity";
import { QuotesService } from "../../quotes/QuotesService";
import { getCmcId } from "../../utils/cmcApi";
import { tryItAsync } from "../../utils/tryIt";
import * as PlayerService from "../../players/PlayerService";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "awardWinPoints" });

export default async function awardWinPoints(
  bets: BetEntity[],
  pointPerUsdForWonBet: number,
) {
  const ethUsdVal = Number(
    new QuotesService().getLatestQuote(getCmcId("ETH"), "price"),
  );
  const winPointAwardTrialsArr = await Promise.all(
    bets.map(async (bet) =>
      tryAwardWinPointsToBet(bet, { ethUsdVal, pointPerUsdForWonBet }),
    ),
  );
  const [successfulAwardBetIds, failedAwardBetIds] =
    getAwardBetIdsFilteredBySuccessOrFail(winPointAwardTrialsArr);
  if (successfulAwardBetIds.length)
    logger.info(
      `Awarded win points for the following betIds [${successfulAwardBetIds.join(", ")}]`,
    );
  if (failedAwardBetIds.length)
    logger.error(
      `Couldn't award win points for the following betIds [${failedAwardBetIds.join(", ")}]`,
    );
}

const tryAwardWinPointsToBet = async (
  bet: BetEntity,
  {
    ethUsdVal,
    pointPerUsdForWonBet,
  }: { ethUsdVal: number; pointPerUsdForWonBet: number },
): Promise<{ success: boolean; betId: BetEntity["id"] }> => {
  if (!bet.winner)
    throw new Error(
      `Bet doesn't have a winner set in database ${JSON.stringify({ bet })}`,
    );

  const addressToAward = bet.winner;
  const betUsdVal =
    bet.currency === zeroAddress ? bet.value * ethUsdVal : bet.value;

  const pointsToAward = Math.floor(betUsdVal) * pointPerUsdForWonBet;
  const changePointsTrial = await tryItAsync(() =>
    PlayerService.changePoints([addressToAward], pointsToAward),
  );
  if (!changePointsTrial.success) {
    logger.error(`Couldn't change points`, {
      betId: bet.id,
      err: changePointsTrial.err,
    });
    return { success: false, betId: bet.id };
  }

  return { success: true, betId: bet.id };
};

const getAwardBetIdsFilteredBySuccessOrFail = (
  winPointAwardTrialsArr: Awaited<ReturnType<typeof tryAwardWinPointsToBet>>[],
) => {
  return winPointAwardTrialsArr.reduce<[string[], string[]]>(
    ([successList, failList], { success, betId }) => {
      if (success) return [successList.concat(betId), failList];
      else return [successList, failList.concat(betId)];
    },
    [[], []],
  );
};

export const utils = {
  tryAwardWinPointsToBet,
  getAwardBetIdsFilteredBySuccessOrFail,
};
