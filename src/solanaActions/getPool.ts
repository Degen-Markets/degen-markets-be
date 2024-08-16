import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { program } from "./constants";
import { buildBadRequestError } from "../utils/errors";
import pools from "./pools.json";
import { LinkedAction } from "@solana/actions-spec";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

const logger: Logger = new Logger({ serviceName: "GetPoolService" });

interface PoolResponse extends ActionGetResponse {
  links: {
    actions: LinkedAction[];
  };
}

export const getPool = async (event: APIGatewayEvent) => {
  const poolId = event.pathParameters?.id as keyof typeof pools;
  if (!poolId) {
    return buildBadRequestError("Missing pool id path parameter");
  }

  if (!pools[poolId]) {
    return buildBadRequestError("Invalid Pool ID!");
  }
  const pool = pools[poolId];

  logger.info(`loading pool with id: ${poolId}`);
  let poolAccount: {
    title: string;
    isPaused: boolean;
    value: BN;
    winningOption: PublicKey;
  } = {
    title: pool.title,
    isPaused: true,
    value: new BN(0),
    winningOption: SystemProgram.programId,
  };
  const metadata: PoolResponse = {
    icon: pool.image,
    label: pool.title,
    title: pool.title,
    description: "",
    links: {
      actions: [],
    },
  };
  try {
    poolAccount = await program.account.pool.fetch(poolId);
    logger.info(`Pool Found: ${JSON.stringify(poolAccount, null, 3)}`);
  } catch (e) {
    metadata.disabled = true;
    //ASK_ANGAD: Ended and concluded diff
    metadata.description = "Pool ended!";
  }
  if (poolAccount.isPaused) {
    logger.info(`Pool concluded`);
    const winningOption = pool.options.find(
      (option) => option.id === poolAccount.winningOption.toString(),
    );
    if (winningOption) {
      logger.info(`Winning option found: ${JSON.stringify(winningOption)}`);
      metadata.description = `If you picked "${winningOption.title}", you can claim your win below:`;
      metadata.links.actions = [
        {
          label: `Claim Win`,
          href: `/pools/${poolId}/options/${winningOption.id}/claim-win`,
        },
      ];
    } else {
      metadata.description = `Pool paused, calculating the winning option!`;
      metadata.links.actions = [];
    }
  } else {
    const { value: poolTotalVal } = await program.account.pool.fetch(poolId);
    const poolOptionsWithCurrVal = await Promise.all(
      pool.options.map(async (option) => {
        const { value } = await program.account.poolOption.fetch(option.id);
        return { ...option, currVal: value };
      }),
    );
    metadata.description = poolOptionsWithCurrVal
      .map((option) => {
        const REQUIRED_BASIS_POINT_PRECISION = 2;
        const PRECISION_FOR_PERCENT = 3;
        const oddsBasisPointsStr = option.currVal
          .muln(10 ** (PRECISION_FOR_PERCENT + REQUIRED_BASIS_POINT_PRECISION))
          .div(poolTotalVal)
          .toString();
        const oddsPercStr = [
          oddsBasisPointsStr.slice(0, -REQUIRED_BASIS_POINT_PRECISION),
          oddsBasisPointsStr.slice(-REQUIRED_BASIS_POINT_PRECISION),
        ].join(".");
        return `${option.title}: ${oddsPercStr}%\n`;
      })
      .join("\n");
    metadata.links.actions = [
      ...pool.options.map((option) => ({
        label: `Bet 1 SOL on "${option.title}"`,
        href: `/pools/${poolId}/options/${option.id}?value=1`,
      })),
      ...pool.options.map((option) => ({
        label: `${option.title}`,
        href: `/pools/${poolId}/options/${option.id}?value={amount}`,
        parameters: [
          {
            name: "amount",
            label: "Enter a SOL amount",
          },
        ],
      })),
    ];
  }

  return {
    statusCode: 200,
    body: JSON.stringify(metadata),
    headers: ACTIONS_CORS_HEADERS,
  };
};
