import { Logger } from "@aws-lambda-powertools/logger";
import { Client, ClientConfig } from "pg";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import * as fs from "fs";
import { SecretClient } from "./SecretClient";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";

export class DatabaseClient {
  private readonly logger = new Logger({ serviceName: "DatabaseClient" });
  private secretClient = new SecretClient();
  private secretName = getMandatoryEnvVariable("DATABASE_PASSWORD_SECRET");
  private user = getMandatoryEnvVariable("DATABASE_USERNAME");
  private database = getMandatoryEnvVariable("DATABASE_DATABASE_NAME");
  private host = getMandatoryEnvVariable("DATABASE_HOST");
  private port = Number(getMandatoryEnvVariable("DATABASE_PORT"));
  private password: string | undefined = undefined;

  private getPassword = async (): Promise<string> => {
    try {
      if (this.password) {
        return this.password;
      }
      const secretValue = await this.secretClient.loadJsonSecretValue<{
        password: string;
      }>(this.secretName);
      return secretValue.password;
    } catch (e) {
      this.logger.error("failed to fetch database password", { error: e });
      throw e;
    }
  };

  createConnection = async (): Promise<Client> => {
    const config: ClientConfig = {
      user: this.user,
      host: this.host,
      database: this.database,
      password: await this.getPassword(),
      port: this.port,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("resources/db/rds-global-bundle.pem", "utf8"),
      },
      connectionTimeoutMillis: 10_000,
    };
    this.logger.info("connecting to database", { ...config, password: "***" });
    const client = new Client(config);
    await client.connect();
    return client;
  };

  async makeDb(): Promise<{ db: NodePgDatabase; connection: Client }> {
    const connection = await this.createConnection();
    const db = drizzle(connection);
    return {
      db,
      connection,
    };
  }

  async withDb<T>(fn: (db: NodePgDatabase) => Promise<T>): Promise<T> {
    const { db, connection } = await this.makeDb();
    try {
      return await fn(db);
    } finally {
      await connection.end();
    }
  }
}
