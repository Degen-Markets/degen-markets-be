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
export const buildForbiddenError = (message: string) => {
  return buildHttpResponse({
    status: 403,
    body: {
      message,
      error: "Forbidden",
    },
  });
};
export const buildUnauthorizedError = (message: string) => {
  return buildHttpResponse({
    status: 401,
    body: {
      message,
      error: "Unauthorized",
    },
  });
};
export const buildInternalServerError = (message: unknown) => {
  return buildHttpResponse({
    status: 500,
    body: {
      message,
      error: "Internal Server Error",
    },
  });
};
export const buildBadRequestError = (message: unknown) => {
  return buildHttpResponse({
    status: 400,
    body: { message },
  });
};
export const buildNotFoundError = (message: string) => {
  return buildHttpResponse({
    status: 404,
    body: {
      message,
      error: "Not Found",
    },
  });
};
