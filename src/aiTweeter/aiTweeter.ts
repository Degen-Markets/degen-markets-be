import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import {
  formatTweets,
  getTweetsFromSomeRandomUsers,
  getRandomPrompt,
  getRandomSystemRole,
  Tweet,
  getRandomReplyPrompt,
  isWithinTimeLimit,
  getRandomElements,
} from "./utils";
import { replyToTweet } from "../utils/twitterBot";
import { sendSlackNotification } from "../utils/slackNotifier";

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
      const isWithinTimeframe = isWithinTimeLimit(tweet.createdAt);
      logger.info(`Came up with the following reply: `, {
        result: firstChoice,
        tweet,
        replyPrompt,
        systemRole,
        temperature,
        isWithinTimeframe,
      });

      if (firstChoice?.content && isWithinTimeframe) {
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
    tweets = await getTweetsFromSomeRandomUsers();

    if (tweets.length === 0) {
      const message = "No valid tweets found from any users, ending execution";
      logger.warn(message);
      return;
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const errorDetails = {
      error: error.message,
      stack: error.stack,
    };

    logger.error("Failed to fetch tweets", errorDetails);
    await sendSlackNotification({
      type: "error",
      title: "AI Tweeter: Failed to Fetch Tweets",
      details: errorDetails,
      error,
    });
    return;
  }

  const twoRandomTweets = getRandomElements(tweets, 2);

  if (twoRandomTweets.length < 2) {
    const message = "Not enough valid tweets to generate content";
    logger.warn(message, {
      foundTweets: twoRandomTweets.length,
    });
    await sendSlackNotification({
      type: "warning",
      title: "AI Tweeter: Insufficient Tweet Count",
      details: {
        message,
        foundTweets: twoRandomTweets.length,
      },
    });
    return;
  }

  const formattedTweets = formatTweets(twoRandomTweets);
  const basePrompt = getRandomPrompt();
  const systemRole = getRandomSystemRole();

  try {
    await replyToTweets(tweets, systemRole);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const errorDetails = {
      error: error.message,
      stack: error.stack,
    };

    logger.error("Failed to reply to tweets", errorDetails);
    await sendSlackNotification({
      type: "error",
      title: "AI Tweeter: Failed to Reply to Tweets",
      details: errorDetails,
      error,
    });
  }

  try {
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
        // await sendBotTweet(firstChoice.content.replace(/"/g, ""));
      } catch (e) {
        logger.error("Failed to tweet original post", e as Error);
        const error = e instanceof Error ? e : new Error(String(e));
        const errorDetails = {
          error: error.message,
          stack: error.stack,
          tweetContent: firstChoice.content,
        };

        logger.error("Failed to send tweet", errorDetails);
        await sendSlackNotification({
          type: "error",
          title: "AI Tweeter: Failed to Send Tweet",
          details: errorDetails,
          error,
        });
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const errorDetails = {
      error: error.message,
      stack: error.stack,
    };

    logger.error("Failed to generate or send tweet", errorDetails);
    await sendSlackNotification({
      type: "error",
      title: "AI Tweeter: Failed to Generate or Send Tweet",
      details: errorDetails,
      error,
    });
  }
};
