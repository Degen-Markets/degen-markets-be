import { twitterUserIds } from "./constants";
import { fetchLastTweetForUser } from "../utils/twitterBot";

const get3RandomTwitterUserIds = (): string[] => {
  const shuffled = [...twitterUserIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

type Tweet = {
  userId: string;
  text: string;
};

export const get3RandomTweets = async (): Promise<Tweet[]> => {
  const users = get3RandomTwitterUserIds();

  return await Promise.all(
    users.map(async (userId) => {
      const text = await fetchLastTweetForUser(userId); // Fetch the last tweet
      return { userId, text }; // Return both the userId and tweet
    }),
  );
};

export const formatTweets = (tweets: Tweet[]): string =>
  tweets.reduce((result, tweet, index) => {
    return result + `${index + 1}. ${tweet.text}\n`;
  }, "");
