import { APIGatewayProxyEventV2 } from "aws-lambda";
import { connection, defaultBanner, program } from "./constants";
import { derivePoolAccountKey } from "../pools/utils";
import { getTitleHash } from "../utils/cryptography";
import * as anchor from "@coral-xyz/anchor";
import { ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import ImageService from "../utils/ImageService";
import S3Service from "../utils/S3Service";
import { tryItAsync } from "../utils/tryIt";
import axios from "axios";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../utils/httpResponses";
import { typedIncludes } from "../utils/typedStdLib";

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
  if (!poolTitle || !account) {
    logger.error("Pool title or account not found", { poolTitle, account });
    return buildBadRequestError("Bad request!", ACTIONS_CORS_HEADERS);
  }

  let finalImgUrl = defaultBanner;

  if (imageUrl) {
    const trial = await tryItAsync<string, Error>(async () =>
      processAndUploadImage(imageUrl),
    );
    if (!trial.success) {
      logger.error("Error processing image", { error: trial.err });
      return buildBadRequestError(
        (trial.err as Error).message,
        ACTIONS_CORS_HEADERS,
      );
    }

    finalImgUrl = trial.data;
  }

  // TODO: test Pool with that title does not exist
  const poolAccountKey = derivePoolAccountKey(poolTitle).toString();

  try {
    const transaction = await program.methods
      .createPool(poolTitle, getTitleHash(poolTitle), finalImgUrl, description)
      .accounts({
        poolAccount: poolAccountKey,
        admin: account,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    const creator = new PublicKey(account);

    const block = await connection.getLatestBlockhash();
    transaction.feePayer = creator;
    transaction.recentBlockhash = block.blockhash;

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
              icon: finalImgUrl,
              title: "Create Bet Option",
              description: "Option #1 for your bet",
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create the first option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=2&image=${imageUrl}&poolTitle=${poolTitle}&options={title}`,
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

    logger.info("Pool Creation transaction serialized", { ...payload });

    return buildOkResponse(payload, ACTIONS_CORS_HEADERS);
  } catch (e) {
    logger.error((e as Error).message, { error: e });
    return buildInternalServerError(
      "Something went wrong, please try again",
      ACTIONS_CORS_HEADERS,
    );
  }
};

/**
 * Process and upload an image to S3
 * @param imageUrl - The URL of the image to process
 * @returns The URL of the uploaded image on S3
 */
const processAndUploadImage = async (imageUrl: string): Promise<string> => {
  const getTrial = await tryItAsync(() =>
    axios.get(imageUrl, { responseType: "arraybuffer" }),
  );
  if (!getTrial.success) {
    logger.error("Couldn't fetch image", { imageUrl });
    throw new Error("Couldn't find an image at that URL");
  }
  const imgBuffer = getTrial.data.data;
  if (!Buffer.isBuffer(imgBuffer)) {
    logger.error("Image URL didn't return a buffer", { imageUrl });
    throw new Error("Couldn't find an image at that URL");
  }

  const getTypeTrial = await tryItAsync(() => ImageService.getType(imgBuffer));
  if (!getTypeTrial.success) {
    logger.error("Error getting image type", { error: getTypeTrial.err });
    throw new Error("Couldn't find an image at that URL");
  }
  const imageType = getTypeTrial.data;

  if (!typedIncludes(VALID_IMAGE_EXTENSIONS, imageType)) {
    logger.error("Invalid image type", { imageType });
    const uppercasedList = VALID_IMAGE_EXTENSIONS.map((ext) =>
      ext.toUpperCase(),
    );
    const errMsg = `Invalid image type. Try a valid ${uppercasedList.join("/")} image`;
    throw new Error(errMsg);
  }

  const filePath = `${S3Service.publicFolder}/${crypto.randomUUID()}.${imageType}`;
  const uploadRes = await S3Service.upload(imgBuffer, filePath, {
    ContentDisposition: "inline",
    ContentType: `image/${imageType}`,
  });
  return uploadRes.url;
};

export default generateCreatePoolTx;
