import { Logger } from "@aws-lambda-powertools/logger";
import { Client, ClientConfig, QueryResultRow } from "pg";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import * as fs from "fs";
import { SecretClient } from "./SecretClient";

export class DatabaseClient<T extends QueryResultRow> {
  private readonly logger = new Logger({ serviceName: "DatabaseClient" });
  private secretClient = new SecretClient();
  private secretName = getMandatoryEnvVariable("DATABASE_PASSWORD_SECRET");
  private user = getMandatoryEnvVariable("DATABASE_USERNAME");
  private database = getMandatoryEnvVariable("DATABASE_DATABASE_NAME");
  private host = getMandatoryEnvVariable("DATABASE_HOST");
  private port = Number(getMandatoryEnvVariable("DATABASE_PORT"));
  private password: string | undefined = undefined;

  executeStatement = async (statement: string, values: any[] = []) => {
    const connection = await this.createConnection();
    try {
      const result = await connection.query<T>(statement, values);
      return result;
    } finally {
      await connection.end(); // Close the connection
    }
  };

  executeStatements = async (statements: string[], values: any[][]) => {
    const connection = await this.createConnection();
    try {
      await connection.query("BEGIN"); // Begin the transaction

      const results = [];
      for (let i = 0; i < statements.length; i++) {
        const result = await connection.query<T>(statements[i], values[i]);
        results.push(result);
      }

      await connection.query("COMMIT"); // Commit the transaction
      return results;
    } catch (e) {
      await connection.query("ROLLBACK"); // Rollback the transaction if an error occurs
      this.logger.error("Transaction rolled back", { error: e });
      throw e;
    } finally {
      await connection.end(); // Close the connection
    }
  };

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

  private createConnection = async () => {
    const config: ClientConfig = {
      user: this.user,
      host: this.host,
      database: this.database,
      password: await this.getPassword(),
      port: this.port,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("resources/db/eu-west-1-bundle.pem", "utf8"),
      },
    };
    this.logger.info("connecting to database", { ...config, password: "***" });
    const client = new Client(config);
    await client.connect();
    return client;
  };
}
