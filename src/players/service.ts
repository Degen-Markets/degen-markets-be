import { PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { sql } from "drizzle-orm";

const logger = new Logger({
  serviceName: "PlayersService",
});

export default class PlayersService {
  /**
   * Inserts a new player or updates the points of an existing player.
   * @param db - The database connection
   * @param playerAddress - The address of the player to update/insert
   * @param pointsAwarded - The number of points newly awarded to the player
   * @throws Will throw an error if the points awarded is negative
   */
  static async insertNewOrAwardPoints(
    db: DrizzleDb,
    playerAddress: string,
    pointsAwarded: number,
  ) {
    if (pointsAwarded < 0) throw new Error("Points awarded must be positive");

    const newPlayer: PlayerInsertEntity = {
      address: playerAddress,
      points: pointsAwarded,
    };
    const result = await db
      .insert(playersTable)
      .values(newPlayer)
      .onConflictDoUpdate({
        target: playersTable.address,
        set: {
          points: sql`${playersTable.points} + ${pointsAwarded}`,
        },
      })
      .returning();

    logger.debug("Inserted player or updated points of player", {
      player: result[0],
    });
  }
}
