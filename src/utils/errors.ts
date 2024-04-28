import { InternalServerError, Unauthorized } from "http-errors";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createHttpError = require("http-errors");

export type ErrorProps = {
  status: number;
  message?: string;
  error?: string;
};

export const buildForbiddenError = (message: string) => {
  return createHttpError(
    403,
    JSON.stringify({ status: 403, message, error: "Forbidden" } as ErrorProps),
  );
};

export const buildUnauthorizedError = (message: string) => {
  return Unauthorized(
    JSON.stringify({
      status: 401,
      message,
      error: "Unauthorized",
    } as ErrorProps),
  );
};

export const buildInternalServerError = (message: unknown) => {
  return InternalServerError(
    JSON.stringify({
      status: 500,
      message,
      error: "Internal Server Error",
    } as ErrorProps),
  );
};
export const buildBadRequestError = (message: unknown) => {
  return createHttpError(
    400,
    JSON.stringify({
      status: 400,
      message,
      error: "Bad Request",
    } as ErrorProps),
  );
};

export const buildNotFoundError = (message: string) => {
  return createHttpError(
    404,
    JSON.stringify({ status: 404, message, error: "Not Found" } as ErrorProps),
  );
};
