import middy from "@middy/core";
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { buildNotFoundError } from "./httpResponses";

const logger = new Logger({ serviceName: "notFoundHandler" });

export const notFoundHandler = middy().handler(
  async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    logger.info(JSON.stringify(event, null, 3));
    throw buildNotFoundError(
      `${event.requestContext.http.method} '${event.rawPath}' not found`,
    );
  },
);
