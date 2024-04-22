import {Duration, Fn, StackProps} from 'aws-cdk-lib'
import {TaggedStack} from './TaggedStack'
import {Construct} from 'constructs'
import {DatabaseInstance} from "aws-cdk-lib/aws-rds";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Architecture, Runtime} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Port, SecurityGroup, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";

export interface SettlementStackProps extends StackProps {
  database: DatabaseInstance
  vpc: Vpc
}

export class SettlementStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: SettlementStackProps) {
    super(scope, id, props)

    const {database, vpc} = props

    const settlementLambda = new NodejsFunction(this, 'Settler', {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: `Settlement handler`,
      environment: {
        DATABASE_PASSWORD_SECRET: database.secret!.secretName,
        DATABASE_USERNAME: 'postgres',
        DATABASE_DATABASE_NAME: 'degen-markets',
        DATABASE_HOST: database.instanceEndpoint.hostname,
        DATABASE_PORT: database.instanceEndpoint.port.toString(),
      },
      memorySize: 256,
      functionName: `Settler`,
      entry: path.join(__dirname, '../src/settlement/settler.ts'),
      logRetention: RetentionDays.ONE_MONTH,
      handler: 'handler',
      vpc,
      vpcSubnets: {subnetType: SubnetType.PRIVATE_WITH_EGRESS},
      bundling: {
        externalModules: ['@aws-sdk'],
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
    })

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this, 'ImportedSecurityGroup', Fn.importValue('Database:SecurityGroup:Id'),
    )
    securityGroup.connections.allowFrom(settlementLambda, Port.tcp(5432), 'Settlement lambda access')
    database.secret?.grantRead(settlementLambda)

    const rule = new Rule(this, 'SettlementScheduler', {
      description: 'Settlement scheduler',
      schedule: Schedule.rate(Duration.minutes(1)),
      ruleName: 'SettlementScheduler',
    })
    rule.addTarget(new LambdaFunction(settlementLambda))
  }
}
