import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { defaultBanner } from "./constants";

const logger = new Logger({ serviceName: "finishPoolCreation" });

const finishPoolCreation = async (event: APIGatewayProxyEventV2) => {
  const { account } = JSON.parse(event.body || "{}");
  const pool = event.queryStringParameters?.pool;
  const image = event.queryStringParameters?.image || defaultBanner;
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

  const poolUrl = `https://degenmarkets.com/${pool}`;

  const payload: ActionPostResponse = {
    type: "post",
    message: "Finished creating your bet!",
    links: {
      next: {
        type: "inline",
        action: {
          type: "completed",
          icon: image,
          label: "",
          description: `Your bet is ready. Find it on @DegenMarketsBot`,
          title: "Created your bet!",
          disabled: true,
        },
      },
    },
  };
  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default finishPoolCreation;
