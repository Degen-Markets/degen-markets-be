import { buildOkResponse } from "../utils/httpResponses";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";
import { MAX_MYSTERY_BOXES } from "./postMysteryBoxesPreviewTx";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({
  serviceName: "getMysteryBoxesHandler",
});

const getMysteryBoxesHandler = async () => {
  logger.info("Running `getMysteryBoxesHandler`");

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

  logger.info("Completed `getMysteryBoxesHandler`");
  return buildOkResponse(formData, ACTIONS_CORS_HEADERS);
};

export default getMysteryBoxesHandler;
