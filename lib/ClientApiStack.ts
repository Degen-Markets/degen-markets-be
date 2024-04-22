import {Fn, StackProps} from 'aws-cdk-lib'
import {TaggedStack} from './TaggedStack'
import {Construct} from 'constructs'
import {DatabaseInstance} from 'aws-cdk-lib/aws-rds'
import {LambdaApi} from './constructs/LambdaApi'
import {Port, SecurityGroup, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {IHostedZone} from 'aws-cdk-lib/aws-route53'

export interface ClientApiStackProps extends StackProps {
  certificate: Certificate,
  zone: IHostedZone,
  cname: string,
  vpc: Vpc,
  database: DatabaseInstance
}

export class ClientApiStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: ClientApiStackProps) {
    super(scope, id, props)

    const {database, vpc, cname, zone, certificate} = props

    const {lambda} = new LambdaApi(this, 'ClientApiLambda', {
      cname,
      certificate,
      zone,
      entryFile: 'clientApi/clientApi.ts',
      lambda: {
        functionName: 'ClientApi',
        environment: {
          DATABASE_PASSWORD_SECRET: database.secret!.secretName,
          DATABASE_USERNAME: 'postgres',
          DATABASE_DATABASE_NAME: 'degenmarkets',
          DATABASE_HOST: database.instanceEndpoint.hostname,
          DATABASE_PORT: database.instanceEndpoint.port.toString(),
        },
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
      },
    })
    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this, 'ImportedSecurityGroup', Fn.importValue('Database:SecurityGroup:Id'),
    )
    database.secret?.grantRead(lambda)
    securityGroup.connections.allowFrom(lambda, Port.tcp(5432), 'Client Api access')
  }
}
