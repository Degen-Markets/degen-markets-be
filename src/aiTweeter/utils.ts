import { basePrompts, systemRoles, twitterUserIds } from "./constants";
import { fetchLastTweetForUser } from "../utils/twitterBot";

const getRandomElements = (array: string[], limit: number): string[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

type Tweet = {
  userId: string;
  text: string;
};

export const get3RandomTweets = async (): Promise<Tweet[]> => {
  const users = getRandomElements(twitterUserIds, 3);

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

export const getRandomPrompt = () => getRandomElements(basePrompts, 1)[0]!;

export const getRandomSystemRole = () => getRandomElements(systemRoles, 1)[0]!;
