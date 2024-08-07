import { playersTable } from "../db/players/schema";
import { DatabaseClient } from "./DatabaseClient";
import { drizzle } from "drizzle-orm/node-postgres";

export class DrizzleClient {
  static async make() {
    const dbClient = new DatabaseClient();
    const client = await dbClient.createConnection();
    const db = drizzle(client);
    return db;
  }

  private constructor() {}
}
