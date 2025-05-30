import { StackProps } from "aws-cdk-lib";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { getDeploymentEnv } from "./utils";

export interface CertificateStackProps extends StackProps {
  domain: string;
  cnames: Array<string>;
}

export class CertificateStack extends TaggedStack {
  readonly certificate: Certificate;
  readonly zone: IHostedZone;
  readonly solanaActionsCertificate: Certificate;
  readonly adminWebsiteCertificate: Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const { domain, cnames } = props;

    this.zone = PublicHostedZone.fromLookup(this, "Zone", {
      domainName: domain,
    });

    this.certificate = new Certificate(this, `Cert`, {
      domainName: `${cnames[0]}.${domain}`,
      subjectAlternativeNames: cnames.map((c) => `${c}.${domain}`),
      validation: CertificateValidation.fromDns(this.zone),
    });

    const { subdomainPrefix } = getDeploymentEnv();

    this.solanaActionsCertificate = new Certificate(this, `SolanaActionsCert`, {
      domainName: `${subdomainPrefix}actions.${domain}`,
      validation: CertificateValidation.fromDns(this.zone),
    });

    this.adminWebsiteCertificate = new Certificate(this, `AdminWebsiteCert`, {
      domainName: `${subdomainPrefix}admin.${domain}`,
      validation: CertificateValidation.fromDns(this.zone),
    });
  }
}
