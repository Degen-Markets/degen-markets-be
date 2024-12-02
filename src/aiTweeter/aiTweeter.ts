import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import {
  formatTweets,
  getTweetsFrom3RandomUsers,
  getRandomPrompt,
  getRandomSystemRole,
  Tweet,
  getRandomReplyPrompt,
  isWithinTimeLimit,
  getRandomElements,
} from "./utils";
import { replyToTweet, sendBotTweet } from "../utils/twitterBot";

const openai = new OpenAI({
  apiKey: getMandatoryEnvVariable("OPENAI_API_KEY"),
});

const logger = new Logger({ serviceName: "AITweeter" });

const replyToTweets = async (tweets: Tweet[], systemRole: string) => {
  const replyPrompt = getRandomReplyPrompt();
  const temperature = 1.2;
  const completions = await Promise.all(
    tweets.map((tweet) => {
      return openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemRole,
          },
          {
            role: "user",
            content: `${replyPrompt} ${tweet.text}`,
          },
        ],
        temperature,
        max_tokens: 50,
      });
    }),
  );
  await Promise.all(
    completions.map((completion, index) => {
      const firstChoice = completion.choices[0]?.message;
      const tweet = tweets[index]!;
      logger.info(`Came up with the following reply: `, {
        result: firstChoice,
        tweet,
        replyPrompt,
        systemRole,
        temperature,
      });

      if (firstChoice?.content && isWithinTimeLimit(tweet.createdAt)) {
        // remove double quotes, because OpenAI adds it
        return replyToTweet(firstChoice.content.replace(/"/g, ""), tweet.id);
      }
      return new Promise(() => {});
    }),
  );
};

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
  let tweets: Tweet[];
  try {
    tweets = await getTweetsFrom3RandomUsers();
  } catch (e) {
    logger.error((e as Error).message, e as Error);
    logger.info("Failed to fetch tweets, ending execution");
    return;
  }
  const twoRandomTweets = getRandomElements(tweets, 2);
  const formattedTweets = formatTweets(twoRandomTweets);
  const basePrompt = getRandomPrompt();
  const systemRole = getRandomSystemRole();
  try {
    await replyToTweets(tweets, systemRole);
  } catch (e) {
    logger.error("Failed to reply to tweets", e as Error);
  }
  const temperature = 1.2;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemRole,
      },
      {
        role: "user",
        content: `${basePrompt} ${formattedTweets}`,
      },
    ],
    temperature,
    max_tokens: 50,
  });

  const firstChoice = response.choices[0]?.message;
  logger.info(`Came up with the following tweet: `, {
    result: firstChoice,
    tweets: twoRandomTweets,
    basePrompt,
    systemRole,
    temperature,
  });

  if (firstChoice?.content) {
    try {
      // remove double quotes, because OpenAI adds it
      await sendBotTweet(firstChoice.content.replace(/"/g, ""));
    } catch (e) {
      logger.error("Failed to tweet original post", e as Error);
    }
  }
};
