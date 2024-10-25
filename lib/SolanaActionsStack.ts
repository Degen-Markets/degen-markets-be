import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { LambdaApi } from "./constructs/LambdaApi";
import { Fn, StackProps } from "aws-cdk-lib";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { getDeploymentEnv } from "./utils";

export interface SolanaActionsStackProps extends StackProps {
  certificate: Certificate;
  zone: IHostedZone;
  cname: string;
  vpc: Vpc;
  database: {
    instance: DatabaseInstance;
    name: string;
    username: string;
  };
}

export class SolanaActionsStack extends TaggedStack {
  /** The name of the folder which you intend to allow the open internet to publicly access */
  private BUCKET_PUBLIC_FOLDER_PREFIX = "public";

  constructor(scope: Construct, id: string, props: SolanaActionsStackProps) {
    super(scope, id, props);

    const { vpc, cname, zone, certificate, database } = props;

    const bucket = new Bucket(this, "Bucket", {
      blockPublicAccess: {
        ignorePublicAcls: true,
        blockPublicAcls: true,
        restrictPublicBuckets: false,
        blockPublicPolicy: false,
      },
    });

    const { stackIdPrefix } = getDeploymentEnv();

    const { lambda } = new LambdaApi(this, "SolanaActionsApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "solanaActions/solanaActions.ts",
      lambda: {
        environment: {
          DATABASE_PASSWORD_SECRET: database.instance.secret!.secretName,
          DATABASE_USERNAME: database.username,
          DATABASE_DATABASE_NAME: database.name,
          DATABASE_HOST: database.instance.instanceEndpoint.hostname,
          DATABASE_PORT: database.instance.instanceEndpoint.port.toString(),
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
          BUCKET_NAME: bucket.bucketName,
          BUCKET_PUBLIC_FOLDER: this.BUCKET_PUBLIC_FOLDER_PREFIX,
        },
        vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        bundling: {
          externalModules: ["@aws-sdk"],
          minify: true,
          commandHooks: {
            afterBundling: (inputDir: string, outputDir: string): string[] => [
              `mkdir -p ${outputDir}/resources/db`,
              `cp ${inputDir}/resources/db/rds-global-bundle.pem ${outputDir}/resources/db/`,
            ],
            beforeBundling: (): string[] => [],
            beforeInstall: (): string[] => [],
          },
        },
      },
      apiName: `${stackIdPrefix}SolanaActionsApi`,
    });

    database.instance.secret?.grantRead(lambda);
    bucket.grantReadWrite(lambda);
    bucket.grantPublicAccess(
      `${this.BUCKET_PUBLIC_FOLDER_PREFIX}/*`,
      "s3:GetObject",
    );

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
