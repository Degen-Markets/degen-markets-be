import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../utils/httpResponses";
import { S3 } from "aws-sdk";
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
    const s3 = new S3();
    const uploadParams = {
      Bucket: bucketName,
      Key: `images/${title}.jpg`,
      Body: imageBuffer,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    };
    await s3.upload(uploadParams).promise();

    return buildOkResponse({
      status: "SUCCESS",
    });
  } catch (e) {
    return buildInternalServerError("Something went wrong");
  }
};
