import { APIGatewayProxyEventV2 } from "aws-lambda";
import { connection, defaultBanner, program } from "./constants";
import { derivePoolAccountKey } from "../pools/utils";
import { getTitleHash } from "../utils/cryptography";
import * as anchor from "@coral-xyz/anchor";
import { ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import { getRemoteImageContentType } from "../utils/images";
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
  "image/svg",
  "image/png",
  "image/webp",
  "image/jpeg",
  "image/jpg",
  "image/gif",
] as const;

const generateCreatePoolTx = async (event: APIGatewayProxyEventV2) => {
  const poolTItle = event.queryStringParameters?.title;
  const image = event.queryStringParameters?.image;
  const description = event.queryStringParameters?.description || "";
  const { account } = JSON.parse(event.body || "{}");
  logger.info("Serializing a pool creation tx", {
    title: poolTItle,
    image,
    description,
    account,
  });
  if (!poolTItle || !account) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request!" }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  if (image && !(await isValidImageUrl(image))) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid image input. Try a valid SVG/PNG/JPG/JPEG/GIF image",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  const imageUrl = image || defaultBanner; // fallback to default for '' and undefined images

  // TODO: test Pool with that title does not exist
  const poolAccountKey = derivePoolAccountKey(poolTItle).toString();

  try {
    const transaction = await program.methods
      .createPool(poolTItle, getTitleHash(poolTItle), imageUrl, description)
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
              icon: imageUrl,
              title: "Create Bet Option",
              description: "Option #1 for your bet",
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create the first option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=2&image=${image}&poolTitle=${poolTItle}&options={title}`,
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

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: ACTIONS_CORS_HEADERS,
    };
  } catch (e) {
    logger.error((e as Error).message, { error: e });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Something went wrong, please try again",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
};

/**
 *
 * @param imageUrl Non empty image URL
 * @throws if the {@linkcode imageUrl} is empty
 */
async function isValidImageUrl(imageUrl: string): Promise<boolean> {
  const extType = await getRemoteImageContentType(imageUrl);
  if (typedIncludes(VALID_IMAGE_EXTENSIONS, extType)) {
    return true;
  }
  return false;
}

export default generateCreatePoolTx;
