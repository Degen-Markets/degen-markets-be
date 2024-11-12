import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildBadRequestError, buildOkResponse } from "../utils/httpResponses";
import { ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";

export const MAX_MYSTERY_BOXES = 100;
export const PRICE_PER_BOX_IN_SOL = 0.02;

const mysteryBoxesPreviewTx = async (event: APIGatewayProxyEventV2) => {
  const qs = event.queryStringParameters;
  if (!qs) {
    return buildBadRequestError("Missing query string parameters");
  }
  const { count } = qs;
  if (!count) {
    return buildBadRequestError("Missing count");
  }
  const countNumber = parseInt(count);
  if (
    isNaN(countNumber) ||
    countNumber < 1 ||
    countNumber > MAX_MYSTERY_BOXES
  ) {
    return buildBadRequestError("Invalid count");
  }

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

  return buildOkResponse(res, ACTIONS_CORS_HEADERS);
};

export default mysteryBoxesPreviewTx;
