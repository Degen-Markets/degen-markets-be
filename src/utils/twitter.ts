import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";
import { auth, Client } from "twitter-api-sdk";
import { findMyUser, TwitterResponse } from "twitter-api-sdk/dist/types";

const logger = new Logger({ serviceName: "TwitterUtils" });

export const authClient = new auth.OAuth2User({
  client_id: getMandatoryEnvVariable("TWITTER_CLIENT_ID"),
  client_secret: getMandatoryEnvVariable("TWITTER_CLIENT_SECRET"),
  callback: "https://degenmarkets.com/my-profile",
  // callback: "http://127.0.0.1:3000/profile", // left here for ease of testing
  scopes: ["tweet.read", "users.read", "offline.access"],
});

const twitterBearerToken = getMandatoryEnvVariable("TWITTER_BEARER_TOKEN");

export const requestAccessToken = async (
  twitterCode: string,
): Promise<string | undefined> => {
  logger.info(`Calling twitter to request access token for ${twitterCode}`);
  const res = await authClient.requestAccessToken(twitterCode);
  logger.info(`Received token: ${res.token.access_token}`);
  return res.token.access_token;
};

export const findConnectedUser = async (): Promise<
  TwitterResponse<findMyUser>
> => {
  const client = new Client(authClient);
  return client.users.findMyUser({
    "user.fields": ["id", "profile_image_url", "username"],
  });
};

export const findTweetContentById = async (
  tweetId: string,
): Promise<string | null> => {
  logger.info("Requesting tweet by ID", { tweetId });
  const client = new Client(twitterBearerToken);
  const response = await client.tweets.findTweetById(tweetId);
  logger.info("Received response for `findTweetById`", { response });
  return response.data?.text || null;
};
