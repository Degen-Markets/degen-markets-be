import { APIGatewayProxyEventV2 } from "aws-lambda";
import { connection, defaultBanner, program } from "./constants";
import { derivePoolAccountKey } from "../pools/utils";
import { getTitleHash } from "../utils/cryptography";
import * as anchor from "@coral-xyz/anchor";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";

const logger: Logger = new Logger({ serviceName: "generateCreatePoolTx" });

const generateCreatePoolTx = async (event: APIGatewayProxyEventV2) => {
  const title = event.queryStringParameters?.title;
  const image = event.queryStringParameters?.image;
  const imageUrl = image || defaultBanner;
  const description = event.queryStringParameters?.description || "";
  const { account } = JSON.parse(event.body || "{}");
  logger.info("Serializing a pool creation tx", {
    title,
    imageUrl,
    description,
    account,
  });
  if (!title || !account) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request!" }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
  // TODO: test Pool with that title does not exist
  const poolAccountKey = derivePoolAccountKey(title).toString();

  try {
    const transaction = await program.methods
      .createPool(title, getTitleHash(title), imageUrl, description)
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
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        links: {
          next: {
            // @ts-ignore-next-line
            type: "inline",
            action: {
              icon: imageUrl,
              title: "Create Bet Option",
              label: "Create Option",
              description: "Option #1 for your bet",
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create Option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=2&title={optionTitle}&image=${image}`,
                    parameters: [
                      {
                        name: "optionTitle",
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
        message: "Something went wrong, please try again!",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
};

export default generateCreatePoolTx;
