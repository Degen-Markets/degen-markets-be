import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { program } from "./constants";
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

const invalidPoolBlinkResponse = {
  statusCode: 200,
  body: JSON.stringify({
    description: "Visit degenmarkets.com/pools to see all pools",
    icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/degen-markets-banner.jpeg",
    title: "No such pool exists",
    disabled: true,
    // @ts-expect-error We're ignoring the label, cause we don't want it
  } satisfies ActionGetResponse),
  headers: ACTIONS_CORS_HEADERS,
};

export const getPool = async (event: APIGatewayEvent) => {
  const poolId = event.pathParameters?.id as keyof typeof pools;
  if (!poolId) {
    return invalidPoolBlinkResponse;
  }

  const pool = pools[poolId];
  if (!pool) {
    return invalidPoolBlinkResponse;
  }

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
    description: pool.description,
    links: {
      actions: [],
    },
  };
  try {
    poolAccount = await program.account.pool.fetch(poolId);
    logger.info(`Pool Found: ${JSON.stringify(poolAccount, null, 3)}`);
  } catch (e) {
    metadata.disabled = true;
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
    const poolTotalVal = poolAccount.value;
    let poolOptionsWithPercOfTotalPoolValArr: {
      id: string;
      title: string;
      percOfTotalPoolVal: number;
    }[] = [];
    if (poolTotalVal.toString() === "0") {
      poolOptionsWithPercOfTotalPoolValArr = pool.options.map((option) => ({
        title: option.title,
        id: option.id,
        percOfTotalPoolVal: 100 / pool.options.length,
      }));
    } else {
      const poolOptionsWithVal = await Promise.all(
        pool.options.map(async (option) => {
          const { value } = await program.account.poolOption.fetch(option.id);
          return { ...option, value };
        }),
      );
      poolOptionsWithPercOfTotalPoolValArr = poolOptionsWithVal.map(
        (option) => {
          const REQUIRED_BASIS_POINT_PRECISION = 2;
          const PRECISION_FOR_PERCENT = 3;
          const percOfTotalPoolVal =
            option.value
              .muln(
                10 ** (PRECISION_FOR_PERCENT + REQUIRED_BASIS_POINT_PRECISION),
              )
              .div(poolTotalVal)
              .toNumber() /
            10 ** REQUIRED_BASIS_POINT_PRECISION;
          return { id: option.id, title: option.title, percOfTotalPoolVal };
        },
      );
    }
    metadata.links.actions = [
      ...pool.options.map((option) => ({
        label: `Bet 1 SOL on "${option.title}"`,
        href: `/pools/${poolId}/options/${option.id}?value=1`,
      })),
      ...poolOptionsWithPercOfTotalPoolValArr
        .sort((a, b) => b.percOfTotalPoolVal - a.percOfTotalPoolVal)
        .map((option) => ({
          label: `${option.title} (${option.percOfTotalPoolVal.toFixed(0)}%)`,
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
