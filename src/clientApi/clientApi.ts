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
    path: "/bets/recent",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const bets = await betService.findRecentActivity();
      logger.info(`loading recent bets`);
      return buildOkResponse(bets);
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
