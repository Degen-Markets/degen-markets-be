import { Duration, Fn, StackProps } from "aws-cdk-lib";
import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Key } from "aws-cdk-lib/aws-kms";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";

export interface QuotesImporterStackProps extends StackProps {
  database: DatabaseInstance;
  kmsKey: Key;
  vpc: Vpc;
}

export class QuotesImporterStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: QuotesImporterStackProps) {
    super(scope, id, props);

    const { database, vpc, kmsKey } = props;

    const importerLambda = new NodejsFunction(this, "QuotesImporter", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: "Quotes importer lambda",
      environment: {
        DATABASE_PASSWORD_SECRET: database.secret!.secretName,
        DATABASE_USERNAME: "postgres",
        DATABASE_DATABASE_NAME: "degenmarkets",
        DATABASE_HOST: database.instanceEndpoint.hostname,
        DATABASE_PORT: database.instanceEndpoint.port.toString(),
        CMC_API_KEY: getMandatoryEnvVariable("CMC_API_KEY"),
        // LIVECOINWATCH_API_KEY: getMandatoryEnvVariable("LIVECOINWATCH_API_KEY"),
      },
      memorySize: 256,
      functionName: "QuotesImporter",
      entry: path.join(__dirname, "../src/quotes/handler.ts"),
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
    });
    kmsKey.grantDecrypt(importerLambda);

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "ImportedSecurityGroup",
      Fn.importValue("Database:SecurityGroup:Id"),
    );
    securityGroup.connections.allowFrom(
      importerLambda,
      Port.tcp(5432),
      "Quotes importer lambda access",
    );
    database.secret?.grantRead(importerLambda);

    const rule = new Rule(this, "QuotesImporterScheduler", {
      description: "Quotes Importer scheduler",
      schedule: Schedule.rate(Duration.minutes(1)),
      ruleName: "QuotesImporterScheduler",
    });

    rule.addTarget(new LambdaFunction(importerLambda));
  }
}
