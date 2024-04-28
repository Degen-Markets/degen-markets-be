import middy from "@middy/core";
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { buildNotFoundError } from "./errors";

export const notFoundHandler = middy().handler(
  async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    throw buildNotFoundError(
      `${event.requestContext.http.method} '${event.rawPath}' not found`,
    );
  },
);
