import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildOkResponse } from "../utils/httpResponses";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { MAX_MYSTERY_BOXES } from "./postMysteryBoxesPreviewTx";

const getMysteryBoxes = async (event: APIGatewayProxyEventV2) => {
  const formData: ActionGetResponse = {
    label: "",
    description: "",
    icon: defaultBanner,
    title: "Buy Mystery Boxes",
    links: {
      actions: [
        {
          label: "Buy Boxes",
          type: "transaction",
          href: "/pools/mystery-boxes-preview-tx?count={count}",
          parameters: [
            {
              name: "count",
              type: "number",
              label: "Number of Mystery Boxes to buy",
              required: true,
              max: MAX_MYSTERY_BOXES,
            },
          ],
        },
      ],
    },
  };
  return buildOkResponse(formData, ACTIONS_CORS_HEADERS);
};

export default getMysteryBoxes;
