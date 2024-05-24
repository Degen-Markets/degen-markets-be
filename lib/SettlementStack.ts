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
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Key } from "aws-cdk-lib/aws-kms";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";

export interface SettlementStackProps extends StackProps {
  database: DatabaseInstance;
  privateKeySecret: Secret;
  kmsKey: Key;
  vpc: Vpc;
}

export class SettlementStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: SettlementStackProps) {
    super(scope, id, props);

    const { database, vpc, privateKeySecret, kmsKey } = props;

    const settlementLambda = new NodejsFunction(this, "Settler", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: `Settlement handler`,
      environment: {
        PRIVATE_KEY_SECRET: privateKeySecret.secretName,
        DATABASE_PASSWORD_SECRET: database.secret!.secretName,
        DATABASE_USERNAME: "postgres",
        DATABASE_DATABASE_NAME: "degenmarkets",
        DATABASE_HOST: database.instanceEndpoint.hostname,
        DATABASE_PORT: database.instanceEndpoint.port.toString(),
        CMC_API_KEY: getMandatoryEnvVariable("CMC_API_KEY"),
        BASE_RPC_URL: getMandatoryEnvVariable("BASE_RPC_URL"),
        DEGEN_BETS_ADDRESS: getMandatoryEnvVariable("DEGEN_BETS_ADDRESS"),
        DEGEN_BETS_V2_ADDRESS: getMandatoryEnvVariable("DEGEN_BETS_V2_ADDRESS"),
      },
      memorySize: 256,
      functionName: `Settler`,
      entry: path.join(__dirname, "../src/settlement/settler.ts"),
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
    const secret = Secret.fromSecretNameV2(
      this,
      "PrivateKeySecretImported",
      privateKeySecret.secretName,
    );
    secret.grantRead(settlementLambda);
    kmsKey.grantDecrypt(settlementLambda);

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "ImportedSecurityGroup",
      Fn.importValue("Database:SecurityGroup:Id"),
    );
    securityGroup.connections.allowFrom(
      settlementLambda,
      Port.tcp(5432),
      "Settlement lambda access",
    );
    database.secret?.grantRead(settlementLambda);

    const rule = new Rule(this, "SettlementScheduler", {
      description: "Settlement scheduler",
      schedule: Schedule.rate(Duration.minutes(1)),
      ruleName: "SettlementScheduler",
    });
    rule.addTarget(new LambdaFunction(settlementLambda));
  }
}
