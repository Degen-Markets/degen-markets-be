import { APIGatewayProxyResultV2 } from "aws-lambda";

export type HttpResponse = {
  status: number;
  body: unknown;
};

export const buildHttpResponse = (
  input: HttpResponse,
): APIGatewayProxyResultV2 => ({
  statusCode: input.status,
  body: JSON.stringify(input.body),
});

export const buildOkResponse = (body?: unknown): APIGatewayProxyResultV2 => {
  if (typeof body === "string") {
    return buildHttpResponse({
      status: 200,
      body: { message: body },
    });
  }
  return {
    statusCode: 200,
    body: body ? JSON.stringify(body) : "",
  };
};

export const buildErrorResponse = (
  errorMessage: string,
  statusCode: number = 500,
): APIGatewayProxyResultV2 => {
  return buildHttpResponse({
    status: statusCode,
    body: { error: errorMessage },
  });
};
