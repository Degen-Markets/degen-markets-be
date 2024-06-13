import { TwitterApi } from "twitter-api-v2";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";

const userClient = new TwitterApi({
  appKey: getMandatoryEnvVariable("TWITTER_APP_KEY"),
  appSecret: getMandatoryEnvVariable("TWITTER_APP_SECRET"),
  accessToken: getMandatoryEnvVariable("TWITTER_ACCESS_TOKEN"),
  accessSecret: getMandatoryEnvVariable("TWITTER_ACCESS_SECRET"),
});

export const sendTweet = async (text: string) => {
  await userClient.v2.tweet(text);
};
