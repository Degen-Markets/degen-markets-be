import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";

const logger = new Logger({ serviceName: "finishPoolCreation" });

const finishPoolCreation = (event: APIGatewayProxyEventV2) => {
  const { account } = JSON.parse(event.body || "{}");
  const pool = event.queryStringParameters?.pool;
  logger.info(`finish pool creation called`, { account, pool });
  if (!pool || !account) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad request!",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  const poolUrl = `https://degenmarkets.com/pools/${pool}`;
  const payload: ActionPostResponse = {
    type: "external-link",
    message: `Your bet is ready!`,
    externalLink: poolUrl,
  };
  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default finishPoolCreation;
