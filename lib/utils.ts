import { Environment } from "aws-cdk-lib";

export function requireNotNull<T>(param: T, errorMessage?: string): T {
  if (param === null || param === undefined) {
    throw new Error(
      errorMessage || `value was required to be not null or undefined`,
    );
  }
  return param;
}

export const getEnv = (): Environment => ({
  account: requireNotNull(
    process.env.AWS_ACCOUNT,
    "AWS_ACCOUNT environment variable not found",
  ),
  region: requireNotNull(
    process.env.AWS_REGION,
    "AWS_REGION environment variable not found",
  ),
});
