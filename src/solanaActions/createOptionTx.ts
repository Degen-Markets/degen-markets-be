import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import { _Utils } from "../utils/createOptionTx.utils";

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
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request " }),
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

  try {
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
