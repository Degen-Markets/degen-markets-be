import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildBadRequestError, buildOkResponse } from "../utils/httpResponses";
import { ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { Logger } from "@aws-lambda-powertools/logger";
import { tryIt } from "../utils/tryIt";

export const PRICE_PER_BOX_IN_SOL = 0.02;

const logger = new Logger({
  serviceName: "mysteryBoxesPreviewTxHandler",
});

const mysteryBoxesPreviewTxHandler = async (event: APIGatewayProxyEventV2) => {
  logger.info("Running `mysteryBoxesPreviewTxHandler`", { event });

  const qs = event.queryStringParameters;
  if (!qs) {
    logger.warn("Missing query string parameters");
    return buildBadRequestError("Missing query string parameters");
  }
  logger.debug("Obtained query string parameters", { qs });

  const { count } = qs;
  if (!count) {
    logger.warn("Missing count");
    return buildBadRequestError("Missing count");
  }
  logger.debug("Obtained count from query string parameters", { count });

  const parseTrial = tryIt(() => parseInt(count));
  if (
    !parseTrial.success ||
    isNaN(parseTrial.data) ||
    parseTrial.data < 1 ||
    parseTrial.data % PRICE_PER_BOX_IN_SOL > 0
  ) {
    logger.warn("Invalid count");
    return buildBadRequestError("Invalid number of boxes!");
  }

  const countNumber = parseTrial.data;
  const totalPrice = countNumber * PRICE_PER_BOX_IN_SOL;

  const res: ActionPostResponse = {
    type: "post",
    links: {
      next: {
        type: "inline",
        action: {
          type: "action",
          label: "",
          title: "Confirm Mystery Boxes Purchase",
          description: `Purchasing ${count} boxes for ${totalPrice} SOL`,
          icon: defaultBanner,
          links: {
            actions: [
              {
                type: "post",
                label: `Confirm (${totalPrice} SOL)`,
                href: `/pools/mystery-boxes-confirm-tx?amountInSol=${totalPrice}`,
              },
            ],
          },
        },
      },
    },
  };

  logger.info("Completed `mysteryBoxesPreviewTxHandler`", { res });
  return buildOkResponse(res, ACTIONS_CORS_HEADERS);
};

export default mysteryBoxesPreviewTxHandler;
