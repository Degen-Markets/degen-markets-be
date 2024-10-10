import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { LambdaApi } from "./constructs/LambdaApi";
import { Fn, StackProps } from "aws-cdk-lib";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";

export interface SolanaActionsStackProps extends StackProps {
  certificate: Certificate;
  zone: IHostedZone;
  cname: string;
  vpc: Vpc;
  database: DatabaseInstance;
}

export class SolanaActionsStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: SolanaActionsStackProps) {
    super(scope, id, props);

    const { vpc, cname, zone, certificate, database } = props;

    const { lambda } = new LambdaApi(this, "SolanaActionsApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "solanaActions/solanaActions.ts",
      lambda: {
        functionName: "SolanaActionsHandler",
        environment: {
          DATABASE_PASSWORD_SECRET: database.secret!.secretName,
          DATABASE_USERNAME: "postgres",
          DATABASE_DATABASE_NAME: "degenmarkets",
          DATABASE_HOST: database.instanceEndpoint.hostname,
          DATABASE_PORT: database.instanceEndpoint.port.toString(),
          TWITTER_BOT_APP_KEY: getMandatoryEnvVariable("TWITTER_BOT_APP_KEY"),
          TWITTER_BOT_APP_SECRET: getMandatoryEnvVariable(
            "TWITTER_BOT_APP_SECRET",
          ),
          TWITTER_BOT_ACCESS_TOKEN: getMandatoryEnvVariable(
            "TWITTER_BOT_ACCESS_TOKEN",
          ),
          TWITTER_BOT_ACCESS_TOKEN_SECRET: getMandatoryEnvVariable(
            "TWITTER_BOT_ACCESS_TOKEN_SECRET",
          ),
          TELEGRAM_BOT_KEY: getMandatoryEnvVariable("TELEGRAM_BOT_KEY"),
          TELEGRAM_CHAT_ID: getMandatoryEnvVariable("TELEGRAM_CHAT_ID"),
        },
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
      apiName: "SolanaActionsApi",
    });

    database.secret?.grantRead(lambda);

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "ImportedSecurityGroup",
      Fn.importValue("Database:SecurityGroup:Id"),
    );
    securityGroup.connections.allowFrom(
      lambda,
      Port.tcp(5432),
      "Solana Actions Api access",
    );
  }
}
