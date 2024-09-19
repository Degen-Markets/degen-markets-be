import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { DatabaseClient } from "../clients/DatabaseClient";
import { drizzle } from "drizzle-orm/node-postgres";

const logger = new Logger({ serviceName: "dbMigration" });

export const executeMigrations = async () => {
  logger.info("Making DB Connection");
  const dbClient = new DatabaseClient();
  const connection = await dbClient.createConnection();
  const db = drizzle(connection);
  logger.info("Running migrations");
  await migrate(db, { migrationsFolder: "resources/db/migrations" }); // defined in DatabaseStack (afterBundling)
  await connection.end();
  logger.info("Migrations completed");
};

export const handler = middy(executeMigrations).use(
  injectLambdaContext(logger, { logEvent: true }),
);
