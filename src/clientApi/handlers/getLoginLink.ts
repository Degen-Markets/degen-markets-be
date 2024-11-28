import { buildOkResponse } from "../../utils/httpResponses";
import { Logger } from "@aws-lambda-powertools/logger";
import { getNewAuthClient } from "../../utils/twitter";

const logger = new Logger({ serviceName: "getLoginLink" });

const getLoginLink = () => {
  logger.info("Fetching twitter login link");
  const url = getNewAuthClient().generateAuthURL({
    state: "dm",
    code_challenge: "dm",
    code_challenge_method: "plain",
  });
  return buildOkResponse({ url });
};

export default getLoginLink;
