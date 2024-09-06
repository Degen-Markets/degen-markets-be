import { DatabaseClient } from "./DatabaseClient";
import { drizzle } from "drizzle-orm/node-postgres";

export type DrizzleDb = ReturnType<typeof drizzle>;

export class DrizzleClient {
  static async makeDb(): Promise<DrizzleDb> {
    const dbClient = new DatabaseClient();
    const client = await dbClient.createConnection();
    const db = drizzle(client);
    return db;
  }

  private constructor() {}
}
