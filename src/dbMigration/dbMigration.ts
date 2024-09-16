import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { DrizzleClient } from "../clients/DrizzleClient";

const logger = new Logger({ serviceName: "dbMigration" });

export const executeMigrations = async () => {
  logger.info("Making DB Connection");
  const db = await DrizzleClient.makeDb();
  logger.info("Running migrations");
  await migrate(db, { migrationsFolder: "resources/db/migrations" }); // defined in DatabaseStack (afterBundling)
  logger.info("Migrations completed");
};

export const handler = middy(executeMigrations).use(
  injectLambdaContext(logger, { logEvent: true }),
);
