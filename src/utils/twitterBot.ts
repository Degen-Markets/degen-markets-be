import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { TwitterApi } from "twitter-api-v2";

const userClient = new TwitterApi({
  appKey: getMandatoryEnvVariable("TWITTER_BOT_APP_KEY"),
  appSecret: getMandatoryEnvVariable("TWITTER_BOT_APP_SECRET"),
  accessToken: getMandatoryEnvVariable("TWITTER_BOT_ACCESS_TOKEN"),
  accessSecret: getMandatoryEnvVariable("TWITTER_BOT_ACCESS_TOKEN_SECRET"),
});

export const sendBotTweet = async (text: string): Promise<string> => {
  const tweet = await userClient.v2.tweet(text);
  return tweet.data.id;
};
