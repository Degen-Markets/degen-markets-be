import { Logger } from "@aws-lambda-powertools/logger";
import httpRouterHandler, { Route } from "@middy/http-router";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import {
  APIGatewayEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpSecurityHeaders from "@middy/http-security-headers";
import { notFoundHandler } from "../utils/notFoundHandler";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { BetService } from "../bets/BetService";
import { buildOkResponse } from "../utils/httpResponses";
import * as PlayerService from "../players/PlayerService";
import PoolsJson from "../solanaActions/pools.json";
import { buildBadRequestError } from "../utils/errors";

const logger: Logger = new Logger({ serviceName: "clientApi" });
const betService = new BetService();

const routes: Route<APIGatewayProxyEventV2>[] = [
  {
    method: "OPTIONS",
    path: "/{proxy+}",
    handler: middy().handler(
      async (): Promise<APIGatewayProxyResultV2> => ({
        statusCode: 200,
        body: "success",
      }),
    ),
  },
  {
    method: "GET",
    path: "/bets",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const bets = await betService.findBets(event.queryStringParameters);
      logger.info(`loading bets`);
      return buildOkResponse(bets);
    }),
  },
  {
    method: "GET",
    path: "/bets/{id}",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const bets = await betService.findBetById(event.pathParameters);
      logger.info("loading bet by id");
      return buildOkResponse(bets);
    }),
  },
  {
    method: "GET",
    path: "/tickers",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const tickers = await betService.findTopTradedTickers(
        event.queryStringParameters,
      );
      return buildOkResponse(tickers);
    }),
  },
  {
    method: "GET",
    path: "/stats",
    handler: middy().handler(async () => {
      const stats = await betService.findStats();
      return buildOkResponse(stats);
    }),
  },
  {
    method: "GET",
    path: "/players",
    handler: middy().handler(
      async ({ queryStringParameters: qs }: APIGatewayEvent) => {
        const playerListParams: Parameters<
          typeof PlayerService.findAllPlayers
        >[0] = {};
        if (qs) {
          if (qs.limit) {
            const limit = Number(qs.limit);
            if (isNaN(limit))
              return buildBadRequestError(
                `Invalid limit parameter(${qs.limit})`,
              );

            playerListParams.limit = limit;
          }
          if (qs.offset) {
            const offset = Number(qs.offset);
            if (isNaN(offset))
              return buildBadRequestError(
                `Invalid offset parameter(${qs.offset})`,
              );

            playerListParams.offset = offset;
          }
          if (qs.sort) {
            const [sortByField = "", sortDir = ""] = qs.sort.split(":");
            if (
              PlayerService.getIsValidFieldName(sortByField) &&
              PlayerService.getIsValidSortDirection(sortDir)
            ) {
              playerListParams.orderBy = { [sortByField]: sortDir };
            } else
              return buildBadRequestError(`Invalid sort parameter(${qs.sort})`);
          }
        }
        const players = await PlayerService.findAllPlayers(playerListParams);
        return buildOkResponse(players);
      },
    ),
  },
  {
    method: "GET",
    path: "/pools",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const pools = Object.entries(PoolsJson).map(([id, pool]) => ({
        id,
        ...pool,
      }));
      return buildOkResponse(pools);
    }),
  },
  {
    method: "ANY",
    path: "/{proxy+}",
    handler: notFoundHandler,
  },
];

export const handler = middy(httpRouterHandler(routes))
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(cors({ methods: "OPTIONS,POST,GET,PUT,DELETE", headers: "*" }))
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(
    httpSecurityHeaders({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
