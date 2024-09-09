import { Logger } from "@aws-lambda-powertools/logger";
import httpRouterHandler, { Route } from "@middy/http-router";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpSecurityHeaders from "@middy/http-security-headers";
import { notFoundHandler } from "../utils/notFoundHandler";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { buildErrorResponse, buildOkResponse } from "../utils/httpResponses";
import { getLoginLink, saveTwitterUser } from "./handlers/twitter";
import { getAllPools, getPoolById } from "./handlers/pools";
import PlayersService from "../players/service";
import { DrizzleClient } from "../clients/DrizzleClient";

const logger: Logger = new Logger({ serviceName: "clientApi" });

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
    path: "/pools",
    handler: middy().handler(getAllPools),
  },
  {
    method: "GET",
    path: "/pools/{id}",
    handler: middy().handler(getPoolById),
  },
  {
    method: "GET",
    path: "/twitter-login",
    handler: middy().handler(async () => {
      return buildOkResponse(getLoginLink());
    }),
  },
  {
    method: "POST",
    path: "/save-twitter-user",
    handler: middy().handler(saveTwitterUser),
  },
  {
    method: "GET",
    path: "/players",
    handler: middy().handler(async (event: APIGatewayProxyEventV2) => {
      try {
        const limit = parseInt(event.queryStringParameters?.limit || "10");
        const offset = parseInt(event.queryStringParameters?.offset || "0");
        const sort = event.queryStringParameters?.sort || "points:DESC";
        const db = await DrizzleClient.makeDb();
        const players = await PlayersService.getPlayers(
          db,
          limit,
          offset,
          sort,
        );
        return buildOkResponse(players);
      } catch (error) {
        if (error instanceof Error) {
          return buildErrorResponse(error.message);
        }
        return buildErrorResponse("An unexpected error occurred");
      }
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
