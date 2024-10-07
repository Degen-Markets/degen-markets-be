import { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { connection, defaultBanner, program } from "./constants";
import { getOptionTitleHash } from "../utils/cryptography";
import * as anchor from "@coral-xyz/anchor";
import { deriveOptionAccountKey } from "../poolOptions/utils";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import { LinkedAction } from "@solana/actions-spec";

const logger: Logger = new Logger({ serviceName: "generateCreateOptionTx" });

const generateCreateOptionTx = async (event: APIGatewayProxyEventV2) => {
  logger.info("generating create option tx");
  const pool = event.pathParameters?.poolAddress;
  const poolTitle = event.queryStringParameters?.poolTitle;
  const count = Number(event.queryStringParameters?.count);
  const imageUrl = event.queryStringParameters?.image || defaultBanner;
  const existingOptionsString = event.queryStringParameters?.options || "";
  const existingOptions = existingOptionsString.split(", ");
  const title = existingOptions[existingOptions.length - 1];
  const { account } = JSON.parse(event.body || "{}");

  logger.info("Serializing a create option tx", {
    existingOptionsString,
    title,
    count,
    account,
    pool,
  });

  if (!existingOptionsString || !title || !pool || isNaN(count) || !account) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request!" }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  // TODO: check option doesn't exist
  // TODO: see old options
  // TODO: test non image urls
  const poolAccountKey = new PublicKey(pool);

  const optionAccountKey = await deriveOptionAccountKey(title, poolAccountKey);

  try {
    const transaction = await program.methods
      .createOption(
        title,
        getOptionTitleHash(poolAccountKey, title) as unknown as number[],
      )
      .accountsPartial({
        optionAccount: optionAccountKey,
        poolAccount: poolAccountKey,
        admin: account,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    const creator = new PublicKey(account);

    const block = await connection.getLatestBlockhash();
    transaction.feePayer = creator;
    transaction.recentBlockhash = block.blockhash;

    const finishPoolCreationAction: LinkedAction[] =
      count > 2
        ? [
            {
              type: "post",
              href: `/pools/finish?pool=${poolAccountKey}&image=${imageUrl}`,
              label: "Finish",
            },
          ]
        : [];

    const baseDescription = `Create option #${count} for your bet below. Current options are: ${existingOptionsString}.`;

    const description =
      count > 2
        ? `${baseDescription} Click on "Finish" if you don't wish to create any more options. After clicking on "Finish", your bet will appear on @DegenMarketsBot`
        : baseDescription;

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
              title: poolTitle,
              label: "Create Option",
              description,
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create another option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=${count + 1}&image=${imageUrl}&poolTitle=${poolTitle}&options=${existingOptionsString}, {optionTitle}`,
                    parameters: [
                      {
                        name: "optionTitle",
                        label: "Option text",
                        type: "text",
                      },
                    ],
                  },
                  ...finishPoolCreationAction,
                ],
              },
            },
          },
        },
      },
    });

    logger.info("Option Creation transaction serialized", { ...payload });

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

export default generateCreateOptionTx;
