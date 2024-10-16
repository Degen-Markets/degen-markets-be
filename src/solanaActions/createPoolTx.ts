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

const logger: Logger = new Logger({ serviceName: "generateCreatePoolTx" });

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
    const getTrial = await tryItAsync(() =>
      axios.get(imageUrl, { responseType: "arraybuffer" }),
    );
    if (!getTrial.success) {
      logger.error("Couldn't fetch image", { imageUrl });
      return buildBadRequestError(
        "Couldn't find an image at that URL",
        ACTIONS_CORS_HEADERS,
      );
    }
    let imgBuffer = getTrial.data.data;
    if (!(imgBuffer instanceof Buffer)) {
      logger.error("Image URL didn't return a buffer", { imageUrl });
      return buildBadRequestError(
        "Couldn't find an image at that URL",
        ACTIONS_CORS_HEADERS,
      );
    }

    // user provided images could be bogus, so we have to expect an error path here
    const getTypeTrial = await tryItAsync(() =>
      ImageService.getType(imgBuffer),
    );
    if (!getTypeTrial.success) {
      logger.error("Error getting image type", { error: getTypeTrial.err });
      return buildBadRequestError(
        "Couldn't find an image at that URL",
        ACTIONS_CORS_HEADERS,
      );
    }
    const imageType = getTypeTrial.data;

    let isImageGif = imageType === "gif";
    // Non-gif images are converted to png. This ensures compatibility with dialect, and also
    // eliminates XSS vulnerabilites from svg images
    if (!isImageGif) {
      const convertTrial = await tryItAsync(() =>
        ImageService.convertTo("png", imgBuffer),
      );
      if (!convertTrial.success) {
        logger.error("Error converting image to PNG", {
          error: convertTrial.err,
        });
        return buildBadRequestError(
          "Bad image. Try another image (maybe with another file type)",
          ACTIONS_CORS_HEADERS,
        );
      }

      logger.info("Converted image to PNG", { imgBuffer });
      imgBuffer = convertTrial.data;
    }

    // upload to S3
    const fileType = isImageGif ? "gif" : "png";
    const filePath = `${S3Service.publicFolder}/${crypto.randomUUID()}.${fileType}`;
    const uploadRes = await S3Service.upload(imgBuffer, filePath, {
      ContentDisposition: "inline",
      ContentType: `image/${fileType}`,
    });
    finalImgUrl = uploadRes.url;
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

export default generateCreatePoolTx;
