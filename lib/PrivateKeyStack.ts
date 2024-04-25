import {RemovalPolicy, StackProps} from 'aws-cdk-lib'
import {TaggedStack} from './TaggedStack'
import {Construct} from 'constructs'
import {Secret} from 'aws-cdk-lib/aws-secretsmanager'
import {Key, KeySpec} from 'aws-cdk-lib/aws-kms'

export class PrivateKeyStack extends TaggedStack {
  readonly secret: Secret
  readonly kmsKey: Key

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    this.kmsKey = new Key(this, 'PrivateKeyKms', {
      description: 'Private Key encryption key',
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    this.secret = new Secret(this, 'PrivateKey', {
      secretName: 'PrivateKey',
      removalPolicy: RemovalPolicy.RETAIN,
      encryptionKey: this.kmsKey,
      description: 'Private key',
    })
  }
}
