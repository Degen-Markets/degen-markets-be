import { Logger } from "@aws-lambda-powertools/logger";
import { ActionsJson } from "@solana/actions";

const logger: Logger = new Logger({ serviceName: "Actions/GetMetadata" });

export const getActionsJSON = async (): Promise<ActionsJson> => {
  return {
    rules: [
      // map all root level routes to an action
      {
        pathPattern: "/create-bet/*",
        apiPath: "/bets/*",
      },
    ],
  };
};
