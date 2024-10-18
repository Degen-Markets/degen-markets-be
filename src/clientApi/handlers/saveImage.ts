import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../utils/httpResponses";
import { verifySignature } from "../../utils/cryptography";
import { Logger } from "@aws-lambda-powertools/logger";
import { ADMIN_PUBKEY } from "../constants";
import S3Service from "../../utils/S3Service";

const logger: Logger = new Logger({ serviceName: "saveImage" });

export const saveImage = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Starting processing", { event });
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
  const verified = verifySignature(signature, ADMIN_PUBKEY);
  if (!verified) {
    return buildUnauthorizedError("Incorrect Wallet!");
  }
  // TODO: Check that no such title exists in the DB

  try {
    const imageBuffer = Buffer.from(imageBase64String, "base64");
    const { url: imageUrl } = await S3Service.upload({
      fileBuffer: imageBuffer,
      s3FolderKey: "images",
      s3ObjectName: `${title}.jpg`,
      additionalConfig: {
        ContentType: "image/jpg",
        ContentDisposition: "inline",
      },
    });
    return buildOkResponse({
      status: "SUCCESS",
      imageUrl,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
    return buildInternalServerError("Something went wrong");
  }
};
