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

const logger: Logger = new Logger({ serviceName: "solanaActions" });

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
    path: "/actions.json",
    handler: middy().handler(async () => {
      const actionsJson = await getActionsJSON();
      return {
        statusCode: 200,
        body: JSON.stringify(actionsJson),
        headers: ACTIONS_CORS_HEADERS,
      };
    }),
  },
  {
    method: "GET",
    path: "/bets/{id}",
    handler: middy().handler(async (event: APIGatewayEvent) => {
      const id = event.pathParameters?.id;
      logger.info("loading bet by id");
      const metadata: ActionGetResponse = {
        icon: "https://ucarecdn.com/bb6ebebc-a810-4943-906d-5e3c2ca17b8d/-/preview/880x880/-/quality/smart/-/format/auto/",
        label: `Accept bet ${id}`,
        title: `Accept bet ${id}`,
        description:
          "Buy mockJUP with USDC. Choose a USD amount of USDC from the options below, or enter a custom amount.",
        links: {
          actions: [
            {
              label: "$10",
              href: `/bets/${id}`,
            },
          ],
        },
      };
      return {
        statusCode: 200,
        body: JSON.stringify(metadata),
        headers: ACTIONS_CORS_HEADERS,
      };
    }),
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
