import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildBadRequestError, buildOkResponse } from "../utils/httpResponses";
import { ACTIONS_CORS_HEADERS, CompletedAction } from "@solana/actions";
import { ActionPostResponse } from "@solana/actions";
import { defaultBanner } from "./constants";
import { PRICE_PER_BOX_IN_SOL } from "./postMysteryBoxesPreviewTx";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({
  serviceName: "postMysteryBoxesConfirmTx",
});

const postMysteryBoxesConfirmTx = async (event: APIGatewayProxyEventV2) => {
  const qs = event.queryStringParameters;
  if (!qs) {
    return buildBadRequestError("Missing query string parameters");
  }
  const { amountInSol } = qs;
  if (!amountInSol) {
    return buildBadRequestError("Missing amountInSol");
  }
  logger.debug("amountInSol", amountInSol);
  const amountInSolNumber = parseFloat(amountInSol);

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

  return buildOkResponse(res, ACTIONS_CORS_HEADERS);
};

export default postMysteryBoxesConfirmTx;
