import { Environment } from "aws-cdk-lib";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";

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

// This should match the value in the github workflow (.github/workflows/deploy.yml and deploy-dev.yml)
export enum DeploymentEnv {
  development = "development",
  production = "production",
}

export const getDeploymentEnv = () => {
  const deploymentEnv =
    getMandatoryEnvVariable<DeploymentEnv>("DEPLOYMENT_ENV");
  const subdomainPrefix =
    deploymentEnv === DeploymentEnv.development ? "dev-" : "";
  const stackIdPrefix =
    deploymentEnv === DeploymentEnv.development ? "Dev" : "";
  return { subdomainPrefix, deploymentEnv, stackIdPrefix };
};

export const aiScheduleInMinutes = 150;
