import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";
import { auth, Client } from "twitter-api-sdk";
import { APIGatewayEvent } from "aws-lambda";
import { buildBadRequestError } from "../utils/errors";
import { buildOkResponse } from "../utils/httpResponses";

const logger = new Logger({ serviceName: "TwitterService" });

const authClient = new auth.OAuth2User({
  client_id: getMandatoryEnvVariable("TWITTER_CLIENT_ID"),
  client_secret: getMandatoryEnvVariable("TWITTER_CLIENT_SECRET"),
  callback: "https://degenmarkets.com/my-profile",
  // callback: "http://127.0.0.1:3000/profile", // left here for ease of testing
  scopes: ["tweet.read", "users.read", "offline.access"],
});

const requestAccessToken = async (
  twitterCode: string,
): Promise<string | undefined> => {
  logger.info(`Calling twitter to request access token for ${twitterCode}`);
  const res = await authClient.requestAccessToken(twitterCode);
  logger.info(`Received token: ${res.token.access_token}`);
  return res.token.access_token;
};

const findMyUser = async () => {
  const client = new Client(authClient);
  return client.users.findMyUser({
    "user.fields": ["id", "profile_image_url", "username"],
  });
};

export const getLoginLink = () => {
  logger.info("Fetching twitter login link");
  const url = authClient.generateAuthURL({
    state: "asdf",
    code_challenge: "asdf",
    code_challenge_method: "plain",
  });
  return { url };
};

export const saveTwitterUser = async (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body || "{}");
  const twitterCode = body.twitterCode;
  if (!twitterCode) {
    return buildBadRequestError("Missing Twitter Code!");
  }
  await requestAccessToken(twitterCode);
  const { data: user } = await findMyUser();
  logger.info("Found user", { ...user });
  return buildOkResponse(user);
};
