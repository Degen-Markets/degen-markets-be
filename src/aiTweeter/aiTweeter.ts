import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { sendBotTweet } from "../utils/twitterBot";
const openai = new OpenAI();

const logger = new Logger({ serviceName: "AITweeter" });

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k",
    messages: [
      { role: "system", content: "you are a provocateur" },
      {
        role: "user",
        content: "give me 1 short sentence rage baiting crypto prediction",
      },
    ],
  });

  logger.debug("Got OpenAI Response:", { choices: response.choices });
  const firstChoice = response.choices[0]?.message;
  logger.info(`Came up with the following tweet: ${firstChoice}`);

  // if (firstChoice?.content) {
  //   await sendBotTweet(firstChoice.content);
  // }
};
