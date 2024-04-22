import {TaggedStack} from './TaggedStack'
import {StackProps} from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2'

export class NetworkingStack extends TaggedStack {
  readonly vpc: Vpc

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    this.vpc = new Vpc(this, 'VPC', {
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'PrivateWithEgress',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    })
  }
}