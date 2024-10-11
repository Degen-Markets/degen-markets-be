import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { LinkedAction } from "@solana/actions-spec";
import BN from "bn.js";
import PoolsService from "../pools/service";
import PoolOptionsService from "../poolOptions/service";
import { PoolEntity } from "../pools/types";
import { PoolOptionEntity } from "../poolOptions/types";

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
    icon: defaultBanner,
    title: "No such pool exists",
    disabled: true,
    label: "",
  } satisfies ActionGetResponse),
  headers: ACTIONS_CORS_HEADERS,
};

export const getPool = async (event: APIGatewayProxyEventV2) => {
  try {
    const poolAddress = event.pathParameters?.address;
    if (!poolAddress) {
      return invalidPoolBlinkResponse;
    }

    let pool: PoolEntity | null;
    let options: PoolOptionEntity[];
    logger.info(`loading pool and options for pool address: ${poolAddress}`);
    try {
      [pool, options] = await Promise.all([
        PoolsService.getPoolByAddress(poolAddress),
        PoolOptionsService.getAllInPool(poolAddress),
      ]);
    } catch (e) {
      logger.error("Error interacting with db", e as Error);
      return invalidPoolBlinkResponse;
    }

    if (!pool) {
      logger.error("Pool not found!");
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
            type: "transaction",
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
      let poolOptionsWithPercentages: {
        address: string;
        title: string;
        percOfTotalPoolVal: number;
      }[];
      if (poolTotalVal.toString() === "0") {
        poolOptionsWithPercentages = options.map((option) => ({
          title: option.title,
          address: option.address,
          percOfTotalPoolVal: Math.round(100 / options.length),
        }));
      } else {
        const optionsWithBNVal = options.map((option) => {
          return { ...option, value: new BN(option.value) };
        });
        let totalPercent = 0;
        poolOptionsWithPercentages = optionsWithBNVal.map((option, index) => {
          const REQUIRED_BASIS_POINT_PRECISION = 2;
          const PRECISION_FOR_PERCENT = 2;
          const isLastOption = index === optionsWithBNVal.length - 1;
          const percOfTotalPoolVal = isLastOption
            ? 100 - totalPercent // to ensure we don't reach 99% or 100% because of rounding
            : Math.round(
                option.value
                  .muln(
                    10 **
                      (PRECISION_FOR_PERCENT + REQUIRED_BASIS_POINT_PRECISION),
                  )
                  .div(new BN(poolTotalVal))
                  .toNumber() /
                  10 ** REQUIRED_BASIS_POINT_PRECISION,
              );
          totalPercent += percOfTotalPoolVal;
          return {
            address: option.address,
            title: option.title,
            percOfTotalPoolVal,
          };
        });
      }
      metadata.links.actions = poolOptionsWithPercentages
        .sort((a, b) => b.percOfTotalPoolVal - a.percOfTotalPoolVal)
        .map((option) => ({
          type: "transaction",
          label: `${option.title} (${option.percOfTotalPoolVal}%)`,
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
  } catch (e) {
    logger.error((e as Error).message, { error: e });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong, please try again",
      }),
    };
  }
};
