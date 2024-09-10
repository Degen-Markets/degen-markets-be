import { Logger } from "@aws-lambda-powertools/logger";
import httpRouterHandler, { Route } from "@middy/http-router";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpSecurityHeaders from "@middy/http-security-headers";
import { notFoundHandler } from "../utils/notFoundHandler";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { getAllPools, getPoolById } from "./handlers/pools";
import getLoginLink from "./handlers/getLoginLink";
import saveTwitterProfile from "./handlers/saveTwitterProfile";

const logger: Logger = new Logger({ serviceName: "clientApi" });

const routes: Route<APIGatewayProxyEventV2>[] = [
  {
    method: "OPTIONS",
    path: "/{proxy+}",
    handler: middy().handler(async () => ({
      statusCode: 200,
      body: "success",
    })),
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
    handler: middy().handler(getLoginLink),
  },
  {
    method: "POST",
    path: "/save-twitter-profile",
    handler: middy().handler(saveTwitterProfile),
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
