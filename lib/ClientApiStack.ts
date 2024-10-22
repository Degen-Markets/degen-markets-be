import { Fn, StackProps } from "aws-cdk-lib";
import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { LambdaApi } from "./constructs/LambdaApi";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { getOptionalEnvVariable } from "../src/utils/getOptionalEnvVariable";

export interface ClientApiStackProps extends StackProps {
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

export class ClientApiStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: ClientApiStackProps) {
    super(scope, id, props);

    const { database, vpc, cname, zone, certificate } = props;

    const bucket = new Bucket(this, "Bucket", {
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    const isDevEnv = getOptionalEnvVariable("DEPLOYMENT_ENV") === "development";

    const { lambda } = new LambdaApi(this, "ClientApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "clientApi/clientApi.ts",
      lambda: {
        functionName: `${isDevEnv ? "Dev" : ""}ClientApi`,
        environment: {
          DATABASE_PASSWORD_SECRET: database.instance.secret!.secretName,
          DATABASE_USERNAME: database.username,
          DATABASE_DATABASE_NAME: database.name,
          DATABASE_HOST: database.instance.instanceEndpoint.hostname,
          DATABASE_PORT: database.instance.instanceEndpoint.port.toString(),
          TWITTER_CLIENT_ID: getMandatoryEnvVariable("TWITTER_CLIENT_ID"),
          TWITTER_CLIENT_SECRET: getMandatoryEnvVariable(
            "TWITTER_CLIENT_SECRET",
          ),
          TWITTER_BEARER_TOKEN: getMandatoryEnvVariable("TWITTER_BEARER_TOKEN"),
          BUCKET_NAME: bucket.bucketName,
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
      apiName: "ClientApi",
    });
    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "ImportedSecurityGroup",
      Fn.importValue("Database:SecurityGroup:Id"),
    );
    database.instance.secret?.grantRead(lambda);
    securityGroup.connections.allowFrom(
      lambda,
      Port.tcp(5432),
      "Client Api access",
    );
    bucket.grantReadWrite(lambda);
  }
}
