import { basePrompts, systemRoles, twitterUsers } from "./constants";
import { fetchLastTweetForUser } from "../utils/twitterBot";

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
  }
  return shuffled;
};

const getRandomElements = <T>(array: T[], limit: number): T[] => {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, limit);
};
type Tweet = {
  handle: string;
  text: string;
};

export const get3RandomTweets = async (): Promise<Tweet[]> => {
  const users = getRandomElements(twitterUsers, 3);

  return await Promise.all(
    users.map(async ({ userId, handle }) => {
      const text = await fetchLastTweetForUser(userId); // Fetch the last tweet
      return { handle, text }; // Return both the userId and tweet
    }),
  );
};

export const formatTweets = (tweets: Tweet[]): string =>
  tweets.reduce((result, tweet, index) => {
    return result + `${index + 1}. ${tweet.text}\n`;
  }, "");

export const getRandomPrompt = () => getRandomElements(basePrompts, 1)[0]!;

export const getRandomSystemRole = () => getRandomElements(systemRoles, 1)[0]!;
