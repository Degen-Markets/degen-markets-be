import { TaggedStack } from "./TaggedStack";
import { CfnOutput, Duration, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
} from "aws-cdk-lib/aws-rds";
import {
  BastionHostLinux,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export interface DatabaseStackProps extends StackProps {
  vpc: Vpc;
  instanceSize: InstanceSize;
}

export class DatabaseStack extends TaggedStack {
  readonly database: {
    instance: DatabaseInstance;
    name: string;
    username: string;
  };

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, instanceSize } = props;

    this.database.name = "degenmarkets";
    this.database.username = "postgres";

    this.database.instance = new DatabaseInstance(this, "DatabaseInstance", {
      engine: DatabaseInstanceEngine.POSTGRES,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        instanceSize,
      ),
      publiclyAccessible: false,
      credentials: Credentials.fromGeneratedSecret(this.database.username, {
        secretName: "DatabaseCredentials",
      }),
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      vpc,
      databaseName: this.database.name,
    });

    const migrationLambda = new NodejsFunction(this, "DbMigrationLambda", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: `Db migration lambda`,
      environment: {
        DATABASE_PASSWORD_SECRET: this.database.instance.secret!.secretName,
        DATABASE_USERNAME: this.database.username,
        DATABASE_DATABASE_NAME: this.database.name,
        DATABASE_HOST: this.database.instance.instanceEndpoint.hostname,
        DATABASE_PORT: this.database.instance.instanceEndpoint.port.toString(),
      },
      memorySize: 128,
      functionName: `DbMigration`,
      entry: path.join(__dirname, "../src/dbMigration/dbMigration.ts"),
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
            `cp -r ${inputDir}/resources/db/migrations ${outputDir}/resources/db/migrations`,
            `cp ${inputDir}/resources/db/eu-west-1-bundle.pem ${outputDir}/resources/db/`,
          ],
          beforeBundling: (): string[] => [],
          beforeInstall: (): string[] => [],
        },
      },
    });
    this.database.instance.secret?.grantRead(migrationLambda);
    this.database.instance.connections.allowFrom(
      migrationLambda,
      Port.tcp(this.database.instance.instanceEndpoint.port),
      `migration lambda access`,
    );

    const bastionHost = new BastionHostLinux(this, "BastionHost", {
      vpc,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.NANO,
      ),
      instanceName: "BastionHost",
      subnetSelection: { subnetType: SubnetType.PUBLIC },
    });

    this.database.instance.connections.allowFrom(
      bastionHost,
      Port.tcp(5432),
      "Bastion host connection",
    );

    new CfnOutput(this, "DatabaseSecurityGroupOutput", {
      value: this.database.instance.connections.securityGroups[0]
        ?.securityGroupId as string,
      description: "Database security group id",
      exportName: "Database:SecurityGroup:Id",
    });
  }
}
