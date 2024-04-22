import {TaggedStack} from './TaggedStack'
import {CfnOutput, Duration, StackProps} from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {Credentials, DatabaseInstance, DatabaseInstanceEngine} from 'aws-cdk-lib/aws-rds'
import {BastionHostLinux, InstanceClass, InstanceSize, InstanceType, Port, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'

export interface DatabaseStackProps extends StackProps {
  vpc: Vpc
  instanceSize: InstanceSize
}

export class DatabaseStack extends TaggedStack {
  readonly databaseInstance: DatabaseInstance

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props)

    const {vpc, instanceSize} = props

    const databaseName = 'degenmarkets'

    this.databaseInstance = new DatabaseInstance(this, 'DatabaseInstance', {
      engine: DatabaseInstanceEngine.POSTGRES,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, instanceSize),
      publiclyAccessible: false,
      credentials: Credentials.fromGeneratedSecret('postgres', {
        secretName: 'database.password',
      }),
      vpcSubnets: {subnetType: SubnetType.PRIVATE_ISOLATED},
      vpc,
      databaseName,
    })

    const migrationLambda = new NodejsFunction(this, 'DbMigrationLambda', {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: `Db migration lambda`,
      environment: {
        DATABASE_PASSWORD_SECRET: this.databaseInstance.secret!.secretName,
        DATABASE_USERNAME: 'postgres',
        DATABASE_DATABASE_NAME: databaseName,
        DATABASE_HOST: this.databaseInstance.instanceEndpoint.hostname,
        DATABASE_PORT: this.databaseInstance.instanceEndpoint.port.toString(),
      },
      memorySize: 128,
      functionName: `DbMigration`,
      entry: path.join(__dirname, '../src/dbMigration/dbMigration.ts'),
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
            `cp -r ${inputDir}/resources/db/migrations ${outputDir}/resources/db/`,
            `cp ${inputDir}/resources/db/eu-west-1-bundle.pem ${outputDir}/resources/db/`,
          ],
          beforeBundling: (): string[] => [],
          beforeInstall: (): string[] => [],
        },
      },
    })
    this.databaseInstance.secret?.grantRead(migrationLambda)
    this.databaseInstance.connections.allowFrom(
      migrationLambda,
      Port.tcp(this.databaseInstance.instanceEndpoint.port),
      `migration lambda access`,
    )

    const bastionHost = new BastionHostLinux(this, 'BastionHost', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.NANO),
      instanceName: 'BastionHost',
      subnetSelection: {subnetType: SubnetType.PUBLIC},
    })

    this.databaseInstance.connections.allowFrom(bastionHost, Port.tcp(5432), 'Bastion host connection')

    new CfnOutput(this, 'DatabaseSecurityGroupOutput', {
      value: this.databaseInstance.connections.securityGroups[0].securityGroupId,
      description: 'Database security group id',
      exportName: 'Database:SecurityGroup:Id',
    })
  }
}