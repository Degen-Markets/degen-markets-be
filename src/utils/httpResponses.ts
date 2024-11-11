import { APIGatewayProxyResultV2 } from "aws-lambda";

export type HttpResponse = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

export const buildHttpResponse = (
  input: HttpResponse,
): APIGatewayProxyResultV2 => ({
  statusCode: input.status,
  body: JSON.stringify(input.body),
  headers: input.headers,
});

export const buildOkResponse = (
  body?: unknown,
  headers?: Record<string, string>,
): APIGatewayProxyResultV2 => {
  if (typeof body === "string") {
    return buildHttpResponse({
      status: 200,
      body: { message: body },
      headers,
    });
  }
  return {
    statusCode: 200,
    body: body ? JSON.stringify(body) : "",
    headers,
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
export const buildInternalServerError = (
  message: unknown,
  headers?: Record<string, string>,
) => {
  return buildHttpResponse({
    status: 500,
    body: {
      message,
      error: "Internal Server Error",
    },
    headers,
  });
};
export const buildBadRequestError = (
  message: unknown,
  headers?: Record<string, string>,
) => {
  return buildHttpResponse({
    status: 400,
    body: { message },
    headers,
  });
};

export const buildNotFoundError = (
  message: string,
  headers?: Record<string, string>,
) => {
  return buildHttpResponse({
    status: 404,
    body: {
      message,
      error: "Not Found",
    },
    headers,
  });
};
