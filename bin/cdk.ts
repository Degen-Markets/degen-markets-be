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
import { SettlementStack } from "../lib/SettlementStack";
import { PrivateKeyStack } from "../lib/PrivateKeyStack";
import { QuotesImporterStack } from "../lib/QuotesImporterStack";

configDotEnv();

const app = new cdk.App();

const { certificate, zone } = new CertificateStack(app, "Certificates", {
  domain: "degenmarkets.com",
  cnames: ["api", "webhooks"],
  env: {
    ...getEnv(),
    region: "us-east-1",
  },
});

const { vpc } = new NetworkingStack(app, "Networking", {
  env: getEnv(),
});

const { databaseInstance } = new DatabaseStack(app, "Database", {
  vpc,
  instanceSize: InstanceSize.MICRO,
  env: getEnv(),
  crossRegionReferences: true,
});

new ClientApiStack(app, "ClientApi", {
  vpc,
  certificate,
  zone,
  cname: "api",
  database: databaseInstance,
  env: getEnv(),
  crossRegionReferences: true,
});

new WebhookApiStack(app, "WebhookApi", {
  vpc,
  certificate,
  zone,
  database: databaseInstance,
  cname: "webhooks",
  env: getEnv(),
  crossRegionReferences: true,
});

const { kmsKey, secret } = new PrivateKeyStack(app, "PrivateKey", {
  env: getEnv(),
});

new SettlementStack(app, "Settlement", {
  vpc,
  kmsKey: kmsKey,
  privateKeySecret: secret,
  database: databaseInstance,
  env: getEnv(),
});

new QuotesImporterStack(app, "StrikePrice", {
  vpc,
  kmsKey: kmsKey,
  database: databaseInstance,
  env: getEnv(),
});
