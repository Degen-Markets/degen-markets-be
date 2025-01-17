import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import { _Utils } from "../utils/createOptionTx.utils";
import { sendSlackNotification } from "../utils/slackNotifier";

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

  if (!poolTitle || !existingOptionsString) {
    const error = "Missing pool title or options";
    logger.error(error, { poolTitle, existingOptionsString });

    await sendSlackNotification({
      type: "error",
      title:
        "Solana (createOptionTx): Failed to Create Option - Missing Parameters",
      details: {
        error,
        poolTitle,
        existingOptionsString,
        pool,
        account,
      },
    });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request" }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  logger.info("Serializing a create option tx", {
    existingOptionsString,
    title,
    count,
    account,
    pool,
  });

  if (!existingOptionsString || !title || !pool || isNaN(count) || !account) {
    const error = "Invalid or missing required parameters";
    logger.error(error, {
      existingOptionsString,
      title,
      pool,
      count,
      account,
    });

    await sendSlackNotification({
      type: "error",
      title:
        "Solana (createOptionTx): Failed to Create Option - Invalid Parameters",
      details: {
        error,
        existingOptionsString,
        title,
        pool,
        count,
        account,
        imageUrl,
      },
    });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request!" }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
  // TODO: check option doesn't exist
  // TODO: see old options
  // TODO: test non image urls

  try {
    const poolAccountKey = new PublicKey(pool);
    const payload = await _Utils.serializeCreateOptionTx({
      title,
      poolAccountKey,
      account,
      count,
      imageUrl,
      poolTitle,
      existingOptionsString,
    });

    logger.info("Option Creation transaction serialized", { ...payload });
    await sendSlackNotification({
      type: "info",
      title: "Solana (CreateOptionTx): New Option Created",
      details: {
        poolTitle,
        imageUrl,
        title,
        account: account.toString(),
        count,
        existingOptionsString,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: ACTIONS_CORS_HEADERS,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create option", {
      error: errorMessage,
      pool,
      title,
      account,
    });

    await sendSlackNotification({
      type: "error",
      title:
        "Solana (createOptionTx): Failed to Create Option - Transaction Error",
      details: {
        error: errorMessage,
        pool,
        poolTitle,
        title,
        account,
        count,
        imageUrl,
        existingOptionsString,
      },
      error: error instanceof Error ? error : new Error(String(error)),
    });

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
