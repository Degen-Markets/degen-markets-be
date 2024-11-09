import { APIGatewayProxyEventV2 } from "aws-lambda";
import { defaultBanner } from "./constants";
import { derivePoolAccountKey } from "../pools/utils";
import { getTitleHash } from "../utils/cryptography";
import * as anchor from "@coral-xyz/anchor";
import { ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import ImageService from "../utils/ImageService";
import S3Service from "../utils/S3Service";
import { tryIt, tryItAsync } from "../utils/tryIt";
import axios from "axios";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../utils/httpResponses";
import { typedIncludes } from "../utils/typedStdLib";
import { connection, program } from "../clients/SolanaProgramClient";

const logger: Logger = new Logger({ serviceName: "generateCreatePoolTx" });

/**
 * Refer https://docs.dialect.to/documentation/actions/specification/get#get-response-body
 * for list of supported image extension types
 * > `icon` - Must be an absolute HTTP or HTTPS URL of an image describing the action. Supported
 * > image formats are SVG, PNG, or WebP image. If none of the above, the client must reject
 * > it as malformed.
 *
 * In practice we have seen that gif, jpeg and jpg images are also accepted
 */
const VALID_IMAGE_EXTENSIONS = [
  "svg",
  "png",
  "webp",
  "jpeg",
  "jpg",
  "gif",
] as const;

const userFriendlyExtensionsList = VALID_IMAGE_EXTENSIONS.map((ext) =>
  ext.toUpperCase(),
).join("/");

const generateCreatePoolTx = async (event: APIGatewayProxyEventV2) => {
  const poolTitle = event.queryStringParameters?.title;
  const imageUrl = event.queryStringParameters?.image;
  const description = event.queryStringParameters?.description || "";
  const { account } = JSON.parse(event.body || "{}");
  logger.info("Serializing a pool creation tx", {
    title: poolTitle,
    image: imageUrl,
    description,
    account,
  });

  if (!poolTitle) {
    logger.error("Pool title not found", { poolTitle });
    return buildBadRequestError(
      "Pool title missing in request",
      ACTIONS_CORS_HEADERS,
    );
  }

  const creatorTrial = tryIt(() => new PublicKey(account));
  if (!creatorTrial.success) {
    logger.error("Valid account is missing in request", { account });
    return buildBadRequestError(
      "Valid account is missing in request",
      ACTIONS_CORS_HEADERS,
    );
  }
  const creator = creatorTrial.data;

  const imgUrlTrial = await tryItAsync<string, Error>(async () =>
    _Utils.getFinalImgUrl(imageUrl),
  );
  if (!imgUrlTrial.success) {
    logger.error("Error processing image", { error: imgUrlTrial.err });
    return buildBadRequestError(
      (imgUrlTrial.err as Error).message,
      ACTIONS_CORS_HEADERS,
    );
  }
  const imgUrl = imgUrlTrial.data;

  const payloadTrial = await tryItAsync(async () =>
    _Utils.getPayload({
      poolTitle,
      imgUrl,
      description,
      creator,
    }),
  );

  if (!payloadTrial.success) {
    logger.error((payloadTrial.err as Error).message, {
      error: payloadTrial.err,
    });
    return buildInternalServerError(
      "Something went wrong, please try again",
      ACTIONS_CORS_HEADERS,
    );
  }

  const payload = payloadTrial.data;
  logger.info("Pool Creation transaction generated", { ...payload });
  return buildOkResponse(payload, ACTIONS_CORS_HEADERS);
};

export const _Utils = {
  getPayload: async ({
    poolTitle,
    imgUrl,
    description,
    creator,
  }: {
    poolTitle: string;
    imgUrl: string;
    description: string;
    creator: PublicKey;
  }) => {
    // TODO: test Pool with that title does not exist
    const poolAccountKey = derivePoolAccountKey(poolTitle, creator);

    const transaction = await program.methods
      .createPool(poolTitle, getTitleHash(poolTitle), imgUrl, description)
      .accountsStrict({
        poolAccount: poolAccountKey,
        admin: creator,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    logger.debug("Generated transaction", { transaction });

    const block = await connection.getLatestBlockhash();
    transaction.feePayer = creator;
    transaction.recentBlockhash = block.blockhash;

    logger.debug("Added blockhash and creator", { transaction });

    // TODO: display pool title
    const payload = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        links: {
          next: {
            // @ts-ignore-next-line
            type: "inline",
            action: {
              label: "",
              type: "action",
              icon: imgUrl,
              title: "Create Bet Option",
              description: "Option #1 for your bet",
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create the first option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=2&image=${imgUrl}&poolTitle=${poolTitle}&options={title}`,
                    parameters: [
                      {
                        name: "title",
                        label: "Option text",
                        type: "text",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    });

    logger.debug("Created payload", { payload });

    return payload;
  },
  getFinalImgUrl: async (imageUrl: string | undefined): Promise<string> => {
    let result = defaultBanner;

    if (imageUrl) {
      result = await _Utils.processAndUploadImage(imageUrl);
    }
    return result;
  },
  /**
   * Process and upload an image to S3
   * @param imageUrl - The URL of the image to process
   * @returns The URL of the uploaded image on S3
   */
  processAndUploadImage: async (imageUrl: string): Promise<string> => {
    const getTrial = await tryItAsync(() =>
      axios.get(imageUrl, { responseType: "arraybuffer" }),
    );
    if (!getTrial.success) {
      logger.error("Couldn't fetch image", { imageUrl });
      throw new Error("Invalid image URL");
    }
    let imgBuffer = getTrial.data.data;
    if (!Buffer.isBuffer(imgBuffer)) {
      logger.error("Image URL didn't return a buffer", { imageUrl });
      throw new Error("Couldn't find an image at that URL");
    }

    const getTypeTrial = await tryItAsync(() =>
      ImageService.getType(imgBuffer),
    );
    if (!getTypeTrial.success) {
      logger.error("Error getting image type", { error: getTypeTrial.err });
      throw new Error("Couldn't read that image");
    }
    const imageType = getTypeTrial.data;

    if (!typedIncludes(VALID_IMAGE_EXTENSIONS, imageType)) {
      logger.error("Invalid image type", { imageType });
      const errMsg = `Invalid image type. Try a valid ${userFriendlyExtensionsList} image`;
      throw new Error(errMsg);
    }

    if (imageType === "svg") {
      const trial = tryIt(() => ImageService.sanitizeSvg(imgBuffer));
      if (!trial.success) {
        logger.error("Couldn't sanitize SVG", { imgBuffer });
        throw new Error(
          `Incompatible image. Try a valid ${userFriendlyExtensionsList} image`,
        );
      }
    }

    const fileTitle = `${crypto.randomUUID()}.${imageType}`;
    const uploadRes = await S3Service.upload({
      fileBuffer: imgBuffer,
      s3FolderKey: S3Service.publicFolder,
      s3ObjectName: fileTitle,
      additionalConfig: {
        ContentDisposition: "inline",
        ContentType: `image/${imageType}`,
      },
    });
    return uploadRes.url;
  },
};

export default generateCreatePoolTx;
