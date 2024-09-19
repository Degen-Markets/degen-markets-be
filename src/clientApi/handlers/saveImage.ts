import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../utils/httpResponses";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { verifySignature } from "../../utils/cryptography";

const adminPubKey = "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";

export const saveImage = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const body = JSON.parse(event.body || "{}");
  const imageBase64String: string | undefined = body.image;
  if (!imageBase64String) {
    return buildBadRequestError("Missing image");
  }
  const title: string | undefined = body.title;
  if (!title) {
    return buildBadRequestError("Missing title");
  }
  const signature: string | undefined = body.signature;
  if (!signature) {
    return buildBadRequestError("Missing signature");
  }
  const verified = verifySignature(signature, adminPubKey);
  if (!verified) {
    return buildUnauthorizedError("Incorrect Wallet!");
  }
  // TODO: Check that no such title exists in the DB

  try {
    const imageBuffer = Buffer.from(imageBase64String, "base64");
    const bucketName = getMandatoryEnvVariable("BUCKET_NAME");
    const s3Client = new S3Client();
    const uploadParams = {
      Body: imageBuffer,
      Bucket: bucketName,
      Key: `images/${title}.jpg`,
    };
    const putObjectCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(putObjectCommand);

    return buildOkResponse({
      status: "SUCCESS",
    });
  } catch (e) {
    return buildInternalServerError("Something went wrong");
  }
};
