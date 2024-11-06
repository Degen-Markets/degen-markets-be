import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";
import { auth, Client } from "twitter-api-sdk";
import { findMyUser, TwitterResponse } from "twitter-api-sdk/dist/types";
import { tryItAsync } from "./tryIt";

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

export const findUserById = async (
  twitterId: string,
): Promise<{
  twitterId: string;
  twitterUsername: string;
  twitterPfpUrl: string | undefined;
} | null> => {
  logger.info("Finding user by ID", { twitterId });
  const client = new Client(twitterBearerToken);
  const resTrial = await tryItAsync(() =>
    client.users.findUserById(twitterId, {
      "user.fields": ["id", "profile_image_url", "username"],
    }),
  );
  if (!resTrial.success || !resTrial.data.data || resTrial.data.errors) {
    const error = resTrial.success ? resTrial.data.errors : resTrial.err;
    logger.error("Couldn't find user by ID", { error });
    return null;
  }

  const data = resTrial.data.data;

  logger.info("Found user by ID", { data });
  return {
    twitterId: data.id,
    twitterUsername: data.username,
    twitterPfpUrl: data.profile_image_url,
  };
};

export const findTweetById = async (
  tweetId: string,
): Promise<{ content: string; authorId: string; links: string[] } | null> => {
  logger.info("Requesting tweet by ID", { tweetId });
  const client = new Client(twitterBearerToken);
  const response = await client.tweets.findTweetById(tweetId, {
    "tweet.fields": ["text", "author_id", "entities"], // you'll only get back the fields if you ask for them
  });
  if (response.errors) {
    logger.error("Received error response for `findTweetById`", {
      error: response.errors,
    });
    return null;
  }
  logger.info("Received response for `findTweetById`", { data: response.data });
  const { text: content, author_id: authorId, entities } = response.data || {};
  const links = entities?.urls?.map((url) => url.unwound_url || "") || [];
  if (!content || !authorId) {
    return null;
  }
  return { content, authorId, links };
};
