import * as fs from "fs";
import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { DatabaseClient } from "../clients/DatabaseClient";
import middy from "@middy/core";

const logger = new Logger({ serviceName: "dbMigration" });
const databaseClient = new DatabaseClient();
const path = "resources/db/migrations";

export const executeMigration = async () => {
  const migrationFiles = fs.readdirSync(path);
  logger.info("migrating files", { migrationFiles });
  for (const f of migrationFiles) {
    try {
      await migrate(f);
    } catch (e) {
      logger.error(`failed to migrate file ${f}`, { error: e });
    }
  }
};

const migrate = async (file: string) => {
  const fileContent = fs.readFileSync(`${path}/${file}`, "utf8");
  await databaseClient.executeStatement(fileContent);
  console.info(`Successfully migrated ${file}`);
};

export const handler = middy(executeMigration).use(
  injectLambdaContext(logger, { logEvent: true }),
);
