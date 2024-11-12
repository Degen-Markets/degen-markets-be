import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildBadRequestError, buildOkResponse } from "../utils/httpResponses";
import { ACTIONS_CORS_HEADERS, CompletedAction } from "@solana/actions";
import { ActionPostResponse } from "@solana/actions";
import { defaultBanner } from "./constants";
import { PRICE_PER_BOX_IN_SOL } from "./postMysteryBoxesPreviewTx";
import { Logger } from "@aws-lambda-powertools/logger";
import { tryIt } from "../utils/tryIt";

const logger = new Logger({
  serviceName: "postMysteryBoxesConfirmTxHandler",
});

const postMysteryBoxesConfirmTxHandler = async (
  event: APIGatewayProxyEventV2,
) => {
  logger.info("Running `postMysteryBoxesConfirmTxHandler`", { event });
  const qs = event.queryStringParameters;
  if (!qs) {
    logger.warn("Missing query string parameters");
    return buildBadRequestError("Missing query string parameters");
  }
  const { amountInSol } = qs;
  if (!amountInSol) {
    logger.warn("Missing amountInSol");
    return buildBadRequestError("Missing amountInSol");
  }
  logger.debug("amountInSol", amountInSol);

  const parseTrial = tryIt(() => parseFloat(amountInSol));
  if (!parseTrial.success) {
    logger.warn("Invalid amountInSol");
    return buildBadRequestError("Invalid amountInSol");
  }
  const amountInSolNumber = parseTrial.data;

  // TODO: Send txn to blockchain
  const count = amountInSolNumber / PRICE_PER_BOX_IN_SOL;

  const res: ActionPostResponse = {
    type: "post",
    links: {
      next: {
        type: "inline",
        action: {
          type: "completed",
          label: "",
          title: "Confirmed",
          description: `Purchased ${count} boxes for ${amountInSolNumber} SOL`,
          icon: defaultBanner,
        },
      },
    },
  };

  logger.info("Completed `postMysteryBoxesConfirmTxHandler`", { res });
  return buildOkResponse(res, ACTIONS_CORS_HEADERS);
};

export default postMysteryBoxesConfirmTxHandler;
