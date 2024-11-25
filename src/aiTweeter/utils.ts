import { twitterUserIds } from "./constants";
import { fetchLastTweetForUser } from "../utils/twitterBot";

const get3RandomTwitterUserIds = (): string[] => {
  const shuffled = [...twitterUserIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

export const get3RandomTweets = async (): Promise<string[]> => {
  const users = get3RandomTwitterUserIds();
  return await Promise.all(
    users.map((userId) => fetchLastTweetForUser(userId)),
  );
};

export const formatTweets = (tweets: string[]): string =>
  tweets.reduce((result, tweet, index) => {
    return result + `${index + 1}. ${tweet}\n`;
  }, "");
