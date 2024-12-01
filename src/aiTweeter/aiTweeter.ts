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
  isWithinSixMinutesFromNow,
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

    if (firstChoice?.content && isWithinSixMinutesFromNow(tweet.createdAt)) {
      // remove double quotes, because OpenAI adds it
      // return replyToTweet(firstChoice.content.replace(/"/g, ""), tweet.id);
    }
  });
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
  const threeRandomTweets = getRandomElements(tweets, 3);
  const formattedTweets = formatTweets(threeRandomTweets);
  const basePrompt = getRandomPrompt();
  const systemRole = getRandomSystemRole();
  await replyToTweets(tweets, systemRole);
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
    tweets,
    basePrompt,
    systemRole,
    temperature,
  });

  if (firstChoice?.content) {
    // remove double quotes, because OpenAI adds it
    await sendBotTweet(firstChoice.content.replace(/"/g, ""));
  }
};
