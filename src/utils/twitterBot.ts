import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import { TwitterApi } from "twitter-api-v2";
import axios from "axios";
import { forbiddenWords } from "../aiTweeter/constants";
import { Tweet } from "../aiTweeter/utils";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "twitterBot" });

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

export const replyToTweet = async (
  text: string,
  inReplyToTweetId: string,
): Promise<string> => {
  const userClient = getUserClient();
  const options = {
    text,
    reply: { in_reply_to_tweet_id: inReplyToTweetId },
  };

  const tweet = await userClient.v2.tweet(options);
  return tweet.data.id;
};

export type TweetResponse = {
  data: {
    text: string;
    author_id: string;
    created_at: string;
    id: string;
  }[];
};

export const fetchLastTweetsForUser = async (
  userId: string,
): Promise<Tweet[]> => {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=replies,retweets&max_results=5&tweet.fields=created_at,author_id`;

  try {
    const response = await axios.get<TweetResponse>(url, {
      headers: {
        Authorization: `Bearer ${getMandatoryEnvVariable("TWITTER_BOT_BEARER_TOKEN")}`,
      },
    });

    logger.info(`Got tweets response: `, { response });

    if (response.data.data) {
      return response.data.data
        .filter((tweet) => {
          const text = tweet.text.toLowerCase();
          const containsForbiddenWord = forbiddenWords.some((word) =>
            text.includes(word.toLowerCase()),
          );
          return !containsForbiddenWord;
        })
        .map((tweet) => {
          return {
            ...tweet,
            authorId: tweet.author_id,
            createdAt: new Date(tweet.created_at),
          };
        });
    }
    return [];
  } catch (error: any) {
    logger.error("Error fetching last tweet:", {
      data: error.response?.data,
      message: error.message,
      error,
    });
    return [];
  }
};
