import { APIGatewayEvent, APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { program } from "./constants";
import pools from "./pools.json";
import { LinkedAction } from "@solana/actions-spec";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import PoolsService from "../pools/service";
import { PoolEntity } from "../pools/schema";
import { PoolOptionEntity } from "../poolOptions/schema";
import PoolOptionsService from "../poolOptions/service";

const logger: Logger = new Logger({ serviceName: "GetPoolService" });

interface PoolResponse extends ActionGetResponse {
  links: {
    actions: LinkedAction[];
  };
}

const invalidPoolBlinkResponse = {
  statusCode: 200,
  body: JSON.stringify({
    description: "Visit degenmarkets.com to see all pools",
    icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/degen-markets-banner.jpeg",
    title: "No such pool exists",
    disabled: true,
    label: "",
  } satisfies ActionGetResponse),
  headers: ACTIONS_CORS_HEADERS,
};

export const getPool = async (event: APIGatewayProxyEventV2) => {
  const poolAddress = event.pathParameters?.address;
  if (!poolAddress) {
    return invalidPoolBlinkResponse;
  }

  let pool: PoolEntity;
  let options: PoolOptionEntity[];
  logger.info(`loading pool and options for pool address: ${poolAddress}`);
  try {
    [pool, options] = await Promise.all([
      PoolsService.getPoolByAddress(poolAddress),
      PoolOptionsService.getAllByPool(poolAddress),
    ]);
  } catch (e) {
    logger.error("Error getting pool or its options", e as Error);
    return invalidPoolBlinkResponse;
  }

  const metadata: PoolResponse = {
    icon: pool.image,
    label: pool.title,
    title: pool.title,
    description: pool.description,
    links: {
      actions: [],
    },
  };

  if (pool.isPaused) {
    logger.info(`Pool concluded`);
    const winningOption = options.find((option) => option.isWinningOption);
    if (winningOption) {
      logger.info(`Winning option found: ${JSON.stringify(winningOption)}`);
      metadata.description = `If you picked "${winningOption.title}", you can claim your win below:`;
      metadata.links.actions = [
        {
          label: `Claim Win`,
          href: `/pools/${poolAddress}/options/${winningOption.address}/claim-win`,
        },
      ];
    } else {
      metadata.description = `Pool paused, calculating the winning option!`;
      metadata.links.actions = [];
    }
  } else {
    const poolTotalVal = pool.value;
    let poolOptionsWithPercOfTotalPoolValArr: {
      address: string;
      title: string;
      percOfTotalPoolVal: number;
    }[];
    if (poolTotalVal.toString() === "0") {
      poolOptionsWithPercOfTotalPoolValArr = options.map((option) => ({
        title: option.title,
        address: option.address,
        percOfTotalPoolVal: 100 / options.length,
      }));
    } else {
      const poolOptionsWithVal = await Promise.all(
        options.map(async (option) => {
          const { value } = await program.account.poolOption.fetch(
            option.address,
          );
          return { ...option, value };
        }),
      );
      poolOptionsWithPercOfTotalPoolValArr = poolOptionsWithVal.map(
        (option) => {
          const REQUIRED_BASIS_POINT_PRECISION = 2;
          const PRECISION_FOR_PERCENT = 2;
          const percOfTotalPoolVal =
            option.value
              .muln(
                10 ** (PRECISION_FOR_PERCENT + REQUIRED_BASIS_POINT_PRECISION),
              )
              .div(new BN(poolTotalVal))
              .toNumber() /
            10 ** REQUIRED_BASIS_POINT_PRECISION;
          return {
            address: option.address,
            title: option.title,
            percOfTotalPoolVal,
          };
        },
      );
    }
    metadata.links.actions = poolOptionsWithPercOfTotalPoolValArr
      .sort((a, b) => b.percOfTotalPoolVal - a.percOfTotalPoolVal)
      .map((option) => ({
        label: `${option.title} (${Math.round(option.percOfTotalPoolVal)}%)`,
        href: `/pools/${poolAddress}/options/${option.address}?value={amount}`,
        parameters: [
          {
            name: "amount",
            label: "Enter a SOL amount",
          },
        ],
      }));
  }

  return {
    statusCode: 200,
    body: JSON.stringify(metadata),
    headers: ACTIONS_CORS_HEADERS,
  };
};
