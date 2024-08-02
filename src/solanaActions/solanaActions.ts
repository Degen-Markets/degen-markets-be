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
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { getActionsJSON } from "./getActionsJSON";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { generateEnterPoolTx } from "./enterPoolTx";
import { getPool } from "./getPool";

const logger: Logger = new Logger({ serviceName: "solanaActions" });

const routes: Route<APIGatewayProxyEventV2>[] = [
  {
    method: "OPTIONS",
    path: "/{proxy+}",
    handler: middy().handler(
      async (): Promise<APIGatewayProxyResultV2> => ({
        statusCode: 200,
        body: "success",
        headers: ACTIONS_CORS_HEADERS,
      }),
    ),
  },
  {
    method: "GET",
    path: "/pools/{id}",
    handler: middy().handler(getPool),
  },
  {
    method: "POST",
    path: "/pools/{poolId}/options/{optionId}",
    handler: middy().handler(generateEnterPoolTx),
  },
];

export const handler = middy(httpRouterHandler(routes))
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(
    cors({ methods: "OPTIONS,POST,GET,PUT,DELETE", headers: "*", origin: "*" }),
  )
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(
    httpSecurityHeaders({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
