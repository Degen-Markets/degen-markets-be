import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { TwitterApi } from "twitter-api-v2";
import axios from "axios";

const getUserClient = () =>
  new TwitterApi({
    appKey: getMandatoryEnvVariable("TWITTER_BOT_APP_KEY"),
    appSecret: getMandatoryEnvVariable("TWITTER_BOT_APP_SECRET"),
    accessToken: getMandatoryEnvVariable("TWITTER_BOT_ACCESS_TOKEN"),
    accessSecret: getMandatoryEnvVariable("TWITTER_BOT_ACCESS_TOKEN_SECRET"),
  });

export const sendBotTweet = async (text: string): Promise<string> => {
  const userClient = getUserClient();
  const tweet = await userClient.v2.tweet(text);
  return tweet.data.id;
};

export const fetchLastTweetForUser = async (
  userId: string,
): Promise<string> => {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=replies,retweets&max_results=5`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${getMandatoryEnvVariable("TWITTER_BOT_BEARER_TOKEN")}`,
      },
    });
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].text;
    } else {
      return "";
    }
  } catch (error: any) {
    console.error(
      "Error fetching last tweet:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to fetch last tweet.");
  }
};
