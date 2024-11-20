import { Logger } from "@aws-lambda-powertools/logger";
import httpRouterHandler, { Route } from "@middy/http-router";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpSecurityHeaders from "@middy/http-security-headers";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { generateEnterPoolTx } from "./enterPoolTx";
import { getPool } from "./getPool";
import { claimWinTx } from "./claimWinTx";
import { buildBadRequestError } from "../utils/httpResponses";
import getPoolCreationForm from "./getPoolCreationForm";
import generateCreatePoolTx from "./createPoolTx";
import generateCreateOptionTx from "./createOptionTx";
import finishPoolCreation from "./finishPoolCreation";
import getMysteryBoxesHandler from "./getMysteryBoxes";
import generateMysteryBoxPurchaseTx from "./generateMysteryBoxPurchaseTx";

const logger: Logger = new Logger({ serviceName: "solanaActions" });

const routes: Route<APIGatewayProxyEventV2, APIGatewayProxyResultV2>[] = [
  {
    method: "OPTIONS",
    path: "/{proxy+}",
    handler: middy().handler(async () => ({
      statusCode: 200,
      body: "success",
      headers: ACTIONS_CORS_HEADERS,
    })),
  },
  {
    method: "GET",
    path: "/pools/{address}",
    handler: middy().handler(getPool),
  },
  {
    method: "POST",
    path: "/pools/{poolId}/options/{optionId}",
    handler: middy().handler(generateEnterPoolTx),
  },
  {
    method: "POST",
    path: "/pools/{id}/options/{optionId}/claim-win",
    handler: middy().handler(
      (
        event: APIGatewayProxyEventV2,
      ): APIGatewayProxyResultV2 | Promise<APIGatewayProxyResultV2> => {
        const poolId = event.pathParameters?.id;
        const optionId = event.pathParameters?.optionId;
        const { account } = JSON.parse(event.body || "{}");
        if (!poolId || !account || !optionId) {
          return buildBadRequestError("Bad request");
        }
        return claimWinTx(poolId, optionId, account);
      },
    ),
  },
  {
    method: "GET",
    path: "/pools/create",
    handler: middy().handler(getPoolCreationForm),
  },
  {
    method: "POST",
    path: "/pools/create",
    handler: middy().handler(generateCreatePoolTx),
  },
  {
    method: "POST",
    path: "/pools/{poolAddress}/create-option",
    handler: middy().handler(generateCreateOptionTx),
  },
  {
    method: "POST",
    path: "/pools/finish",
    handler: middy().handler(finishPoolCreation),
  },
  {
    method: "GET",
    path: "/pools/mystery-boxes",
    handler: middy().handler(getMysteryBoxesHandler),
  },
  {
    method: "POST",
    path: "/pools/mystery-boxes",
    handler: middy().handler(generateMysteryBoxPurchaseTx),
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
