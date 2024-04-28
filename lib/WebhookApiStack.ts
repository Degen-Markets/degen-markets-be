import { Duration, StackProps } from "aws-cdk-lib";
import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { LambdaApi } from "./constructs/LambdaApi";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface WebhookApiStackProps extends StackProps {
  database: DatabaseInstance;
  certificate: Certificate;
  zone: IHostedZone;
  vpc: Vpc;
  cname: string;
}

export class WebhookApiStack extends TaggedStack {
  readonly smartContractEventQueue: Queue;

  constructor(scope: Construct, id: string, props: WebhookApiStackProps) {
    super(scope, id, props);

    const { cname, zone, certificate, database, vpc } = props;

    const deadLetterQueue = new Queue(this, "SmartContractEventDLQ", {
      queueName: "SmartContractEventsDlq.fifo",
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(14),
      fifo: true,
    });

    this.smartContractEventQueue = new Queue(this, "SmartContractEventQueue", {
      queueName: "SmartContractEvents.fifo",
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      fifo: true,
    });

    const { lambda } = new LambdaApi(this, "WebhookApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "webhookApi/webhookApi.ts",
      lambda: {
        environment: {
          QUEUE_NAME: this.smartContractEventQueue.queueName,
        },
        bundling: {
          externalModules: ["@aws-sdk"],
          minify: true,
        },
      },
      apiName: "WebhookApi",
    });

    this.smartContractEventQueue.grantSendMessages(lambda);

    const smartContractEventHandler = new NodejsFunction(
      this,
      "SmartContractEventHandler",
      {
        architecture: Architecture.ARM_64,
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        description: `Smart contract event handler`,
        environment: {
          DATABASE_PASSWORD_SECRET: database.secret!.secretName,
          DATABASE_USERNAME: "postgres",
          DATABASE_DATABASE_NAME: "degen-markets",
          DATABASE_HOST: database.instanceEndpoint.hostname,
          DATABASE_PORT: database.instanceEndpoint.port.toString(),
        },
        memorySize: 128,
        functionName: `SmartContractEventHandler`,
        entry: path.join(
          __dirname,
          "../src/smartContractEventProcessor/smartContractEventProcessor.ts",
        ),
        logRetention: RetentionDays.ONE_MONTH,
        handler: "handler",
        vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        bundling: {
          externalModules: ["@aws-sdk"],
          minify: true,
          commandHooks: {
            afterBundling: (inputDir: string, outputDir: string): string[] => [
              `mkdir -p ${outputDir}/resources/db`,
              `cp ${inputDir}/resources/db/eu-west-1-bundle.pem ${outputDir}/resources/db/`,
            ],
            beforeBundling: (): string[] => [],
            beforeInstall: (): string[] => [],
          },
        },
      },
    );
    smartContractEventHandler.addEventSource(
      new SqsEventSource(this.smartContractEventQueue),
    );
  }
}
