import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";

class S3Service {
  private static readonly logger = new Logger({ serviceName: "S3Service" });

  private static readonly bucketName = getMandatoryEnvVariable("BUCKET_NAME");

  private static readonly bucketRegion = getMandatoryEnvVariable("AWS_REGION");

  /** The path to the publicly accessible folder, for reference */
  public static readonly publicFolder = "public";

  /**
   * Uploads a file to the S3 bucket associated with the calling stack
   */
  public static async upload({
    fileBuffer,
    s3FolderKey,
    s3ObjectName,
    additionalConfig,
  }: {
    fileBuffer: Buffer;
    s3FolderKey: string;
    s3ObjectName: string;
    additionalConfig?: { ContentDisposition?: string; ContentType?: string };
  }) {
    this.logger.info("Uploading to S3", {
      s3FolderKey,
      s3ObjectName,
      additionalConfig,
    });
    const s3ObjectKey = `${s3FolderKey}/${encodeURIComponent(s3ObjectName)}`;
    const client = new S3Client();
    const cmd = new PutObjectCommand({
      Bucket: this.bucketName,
      Body: fileBuffer,
      Key: s3ObjectKey,
      ...(additionalConfig ? { ...additionalConfig } : {}),
    });
    await client.send(cmd);
    this.logger.info("Successfully uploaded");
    return {
      url: `https://${this.bucketName}.s3.${this.bucketRegion}.amazonaws.com/${s3ObjectKey}`,
    };
  }
}

export default S3Service;
