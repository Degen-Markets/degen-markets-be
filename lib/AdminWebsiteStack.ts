import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { CfnOutput, Duration, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  PriceClass,
  SecurityPolicyProtocol,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

export interface AdminWebsiteStackProps extends StackProps {
  certificate: Certificate;
  zone: IHostedZone;
  cname: string;
}

export class AdminWebsiteStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: AdminWebsiteStackProps) {
    super(scope, id, props);

    const { certificate, zone, cname } = props;
    const domainName = `${cname}.${zone.zoneName}`;

    const bucket = new Bucket(this, "Bucket", {
      accessControl: BucketAccessControl.PRIVATE,
    });

    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, "dist"))],
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
    );
    bucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, `Distribution`, {
      certificate,
      domainNames: [domainName],
      defaultRootObject: "index.html",
      comment: `${id} distribution to serve API`,
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity }),
      },
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    new ARecord(this, `ARecord`, {
      zone,
      recordName: cname,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      ttl: Duration.hours(12),
    });

    // Exported so FE can invalidate cache
    new CfnOutput(this, "DistributionIdExport", {
      value: distribution.distributionId,
      exportName: `${id}:DistributionId`,
      description: `${id} Distribution ID`,
    });

    // Exported so FE can deploy to this bucket (CLI Command: aws s3 cp)
    new CfnOutput(this, "BucketNameExport", {
      value: bucket.bucketName,
      exportName: `${id}:BucketName`,
      description: `${id} S3 Bucket Name`,
    });
  }
}
