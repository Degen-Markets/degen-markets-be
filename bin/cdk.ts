#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { getEnv } from "../lib/utils";
import { config as configDotEnv } from "dotenv";
import { CertificateStack } from "../lib/CertificateStack";
import { DatabaseStack } from "../lib/DatabaseStack";
import { InstanceSize } from "aws-cdk-lib/aws-ec2";
import { NetworkingStack } from "../lib/NetworkingStack";
import { ClientApiStack } from "../lib/ClientApiStack";
import { WebhookApiStack } from "../lib/WebhookApiStack";
import { SolanaActionsStack } from "../lib/SolanaActionsStack";
import { AdminWebsiteStack } from "../lib/AdminWebsiteStack";
import { getOptionalEnvVariable } from "../src/utils/getOptionalEnvVariable";

configDotEnv();

const app = new cdk.App();

const isDevEnv = getOptionalEnvVariable("DEPLOYMENT_ENV") === "development";

const { certificate, zone, solanaActionsCertificate, adminWebsiteCertificate } =
  new CertificateStack(app, `${isDevEnv ? "Dev" : ""}Certificates`, {
    domain: "degenmarkets.com",
    cnames: [
      `${isDevEnv ? "dev-" : ""}api`,
      `${isDevEnv ? "dev-" : ""}webhooks`,
    ],
    env: {
      ...getEnv(),
      region: "us-east-1",
    },
  });

const { vpc } = new NetworkingStack(app, `${isDevEnv ? "Dev" : ""}Networking`, {
  env: getEnv(),
});

const { databaseInstance } = new DatabaseStack(
  app,
  `${isDevEnv ? "Dev" : ""}Database`,
  {
    vpc,
    instanceSize: InstanceSize.MICRO,
    env: getEnv(),
    crossRegionReferences: true,
  },
);

new ClientApiStack(app, `${isDevEnv ? "Dev" : ""}ClientApi`, {
  vpc,
  certificate,
  zone,
  cname: `${isDevEnv ? "dev-" : ""}api`,
  database: databaseInstance,
  env: getEnv(),
  crossRegionReferences: true,
});

new WebhookApiStack(app, `${isDevEnv ? "Dev" : ""}WebhookApi`, {
  vpc,
  certificate,
  zone,
  database: databaseInstance,
  cname: `${isDevEnv ? "dev-" : ""}webhooks`,
  env: getEnv(),
  crossRegionReferences: true,
});

new SolanaActionsStack(app, `${isDevEnv ? "Dev" : ""}SolanaActionsApi`, {
  vpc,
  certificate: solanaActionsCertificate,
  zone,
  cname: `${isDevEnv ? "dev-" : ""}actions`,
  env: getEnv(),
  crossRegionReferences: true,
  database: databaseInstance,
});

new AdminWebsiteStack(app, `${isDevEnv ? "Dev" : ""}AdminWebsiteStack`, {
  certificate: adminWebsiteCertificate,
  zone,
  cname: `${isDevEnv ? "dev-" : ""}admin`,
  crossRegionReferences: true,
  env: getEnv(),
});
