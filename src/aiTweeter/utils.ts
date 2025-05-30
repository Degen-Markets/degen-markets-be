import {
  basePrompts,
  replyPrompts,
  systemRoles,
  twitterUsers,
} from "./constants";
import { fetchLastTweetsForUser } from "../utils/twitterBot";
import { aiScheduleInMinutes } from "../../lib/utils";

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
  }
  return shuffled;
};

export const getRandomElements = <T>(array: T[], limit: number): T[] => {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, limit);
};

export type Tweet = {
  text: string;
  authorId: string;
  createdAt: Date;
  id: string;
};

export const getTweetsFromSomeRandomUsers = async (): Promise<Tweet[]> => {
  const users = getRandomElements(twitterUsers, 9);

  const tweets = await Promise.all(
    users.map(async ({ userId, handle }) => {
      return await fetchLastTweetsForUser(userId);
    }),
  );
  return tweets.flat();
};

export const formatTweets = (tweets: Tweet[]): string =>
  tweets.reduce((result, tweet, index) => {
    return result + `${index + 1}. ${tweet.text}\n`;
  }, "");

export const getRandomPrompt = () => getRandomElements(basePrompts, 1)[0]!;

export const getRandomReplyPrompt = () =>
  getRandomElements(replyPrompts, 1)[0]!;

export const getRandomSystemRole = () => getRandomElements(systemRoles, 1)[0]!;

export const isWithinTimeLimit = (date: Date) => {
  const now = new Date();
  const differenceInMs = Math.abs(now.getTime() - date.getTime());
  const durationInMs = aiScheduleInMinutes * 60 * 1000;
  return differenceInMs <= durationInMs;
};
