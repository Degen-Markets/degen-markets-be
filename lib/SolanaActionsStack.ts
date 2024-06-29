import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { LambdaApi } from "./constructs/LambdaApi";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
import { Fn, StackProps } from "aws-cdk-lib";

export interface SolanaActionsStackProps extends StackProps {
  certificate: Certificate;
  zone: IHostedZone;
  cname: string;
  vpc: Vpc;
}

export class SolanaActionsStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: SolanaActionsStackProps) {
    super(scope, id, props);

    const { vpc, cname, zone, certificate } = props;

    const { lambda } = new LambdaApi(this, "SolanaActionsApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "solanaActions/solanaActions.ts",
      lambda: {
        functionName: "SolanaActionsHandler",
        environment: {
          TWITTER_APP_KEY: getMandatoryEnvVariable("TWITTER_APP_KEY"),
          TWITTER_APP_SECRET: getMandatoryEnvVariable("TWITTER_APP_SECRET"),
          TWITTER_ACCESS_TOKEN: getMandatoryEnvVariable("TWITTER_ACCESS_TOKEN"),
          TWITTER_ACCESS_SECRET: getMandatoryEnvVariable(
            "TWITTER_ACCESS_SECRET",
          ),
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
