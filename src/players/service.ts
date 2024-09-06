import { PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { sql } from "drizzle-orm";

const logger = new Logger({
  serviceName: "PlayersService",
});

export default class PlayersService {
  static async insertPlayerOrUpdatePoints(
    db: DrizzleDb,
    data: PlayerInsertEntity,
  ) {
    const result = await db
      .insert(playersTable)
      .values(data)
      .onConflictDoUpdate({
        target: playersTable.address,
        set: {
          points: sql`${playersTable.points.name} + ${data.points}`,
        },
      })
      .returning();

    logger.debug("Inserted player or updated points of player", {
      player: result[0],
    });
  }
}
