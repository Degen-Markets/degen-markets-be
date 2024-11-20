#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { getEnv, getDeploymentEnv } from "../lib/utils";
import { config as configDotEnv } from "dotenv";
import { CertificateStack } from "../lib/CertificateStack";
import { DatabaseStack } from "../lib/DatabaseStack";
import { InstanceSize } from "aws-cdk-lib/aws-ec2";
import { NetworkingStack } from "../lib/NetworkingStack";
import { ClientApiStack } from "../lib/ClientApiStack";
import { WebhookApiStack } from "../lib/WebhookApiStack";
import { SolanaActionsStack } from "../lib/SolanaActionsStack";
import { AdminWebsiteStack } from "../lib/AdminWebsiteStack";
import { AiTweeterStack } from "../lib/AiTweeterStack";

configDotEnv();

const app = new cdk.App();

const { deploymentEnv, subdomainPrefix, stackIdPrefix } = getDeploymentEnv();

const { certificate, zone, solanaActionsCertificate, adminWebsiteCertificate } =
  new CertificateStack(app, `${stackIdPrefix}Certificates`, {
    domain: "degenmarkets.com",
    cnames: [`${subdomainPrefix}api`, `${subdomainPrefix}webhooks`],
    env: {
      ...getEnv(),
      region: "us-east-1",
    },
  });

const { vpc } = new NetworkingStack(app, `${stackIdPrefix}Networking`, {
  env: getEnv(),
});

const { database } = new DatabaseStack(app, `${stackIdPrefix}Database`, {
  vpc,
  instanceSize:
    deploymentEnv === "development" ? InstanceSize.MICRO : InstanceSize.MICRO,
  env: getEnv(),
  crossRegionReferences: true,
});

new ClientApiStack(app, `${stackIdPrefix}ClientApi`, {
  vpc,
  certificate,
  zone,
  cname: `${subdomainPrefix}api`,
  database,
  env: getEnv(),
  crossRegionReferences: true,
});

new WebhookApiStack(app, `${stackIdPrefix}WebhookApi`, {
  vpc,
  certificate,
  zone,
  database,
  cname: `${subdomainPrefix}webhooks`,
  env: getEnv(),
  crossRegionReferences: true,
});

new SolanaActionsStack(app, `${stackIdPrefix}SolanaActionsApi`, {
  vpc,
  certificate: solanaActionsCertificate,
  zone,
  cname: `${subdomainPrefix}actions`,
  env: getEnv(),
  crossRegionReferences: true,
  database,
});

new AdminWebsiteStack(app, `${stackIdPrefix}AdminWebsiteStack`, {
  certificate: adminWebsiteCertificate,
  zone,
  cname: `${subdomainPrefix}admin`,
  crossRegionReferences: true,
  env: getEnv(),
});

new AiTweeterStack(app, `${stackIdPrefix}AiStack`, {
  env: getEnv(),
  deploymentEnv,
});
