import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import crypto from "node:crypto";
import axios from "axios";
import { derivePoolAccountKey } from "../../pools/utils";
import { connection, program } from "../../clients/SolanaProgramClient";
import { getTitleHash } from "../../utils/cryptography";
import { Logger } from "@aws-lambda-powertools/logger";
import { createPostResponse } from "@solana/actions";
import { tryIt, tryItAsync } from "../../utils/tryIt";
import { defaultBanner } from "../constants";
import { typedIncludes } from "../../utils/typedStdLib";
import ImageService from "../../utils/ImageService";
import S3Service from "../../utils/S3Service";
import { sendSlackNotification } from "../../utils/slackNotifier";

const logger: Logger = new Logger({
  serviceName: "generateCreatePoolTx-utils",
});

const _Utils = {
  serializeCreatePoolTx: async ({
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

    await sendSlackNotification({
      type: "info",
      title: "Solana (CreatePoolTx): New Pool Created",
      details: {
        poolTitle,
        imageUrl: imgUrl,
        description,
        account: creator.toString(),
      },
    });

    return payload;
  },
  getFinalImgUrl: async (
    imageUrl: string | undefined,
    validImgExts: readonly string[],
  ): Promise<string> => {
    let result = defaultBanner;

    if (imageUrl) {
      result = await _Utils.processAndUploadImage(imageUrl, validImgExts);
    }
    return result;
  },
  /**
   * Process and upload an image to S3
   * @param imageUrl - The URL of the image to process
   * @returns The URL of the uploaded image on S3
   */
  processAndUploadImage: async (
    imageUrl: string,
    validImgExts: readonly string[],
  ): Promise<string> => {
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

    const userFriendlyExtensionsList = validImgExts
      .map((ext) => ext.toUpperCase())
      .join("/");

    if (!typedIncludes(validImgExts, imageType)) {
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

export default _Utils;
