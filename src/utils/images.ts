import { Logger } from "@aws-lambda-powertools/logger";
import axios from "axios";
import { tryItAsync } from "./tryIt";

const logger = new Logger({ serviceName: "ImageService" });

/**
 * Find out the content type for a given image from it's url
 */
export async function getRemoteImageContentType(
  imageUrl: string,
): Promise<string | null> {
  logger.info(`Getting image extension type for image URL ${imageUrl}`);

  const getTrial = await tryItAsync(() => axios.get(imageUrl));
  if (!getTrial.success) {
    logger.error(`Failed to fetch image from ${imageUrl}`, {
      err: getTrial.err,
    });
    return null;
  }

  const response = getTrial.data;
  logger.info("Obtained response", { response });

  const headers = response.headers;
  const contentType: string =
    headers["Content-Type"] || headers["content-type"];
  if (!contentType) {
    logger.error("Failed to get content type from headers");
    return null;
  }

  logger.info("Obtained content type", { contentType });
  return contentType;
}
