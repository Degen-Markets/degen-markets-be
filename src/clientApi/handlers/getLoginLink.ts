import { authClient } from "../../utils/twitter";
import { buildOkResponse } from "../../utils/httpResponses";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "getLoginLink" });

const getLoginLink = () => {
  logger.info("Fetching twitter login link");
  const url = authClient.generateAuthURL({
    state: "dm",
    code_challenge: "dm",
    code_challenge_method: "plain",
  });
  return buildOkResponse({ url });
};

export default getLoginLink;
