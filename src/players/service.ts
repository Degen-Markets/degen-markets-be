import { PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { SQL, sql } from "drizzle-orm";

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

  /**
   * Retrieves players with pagination and sorting options.
   * @param db - The database connection
   * @param limit - The maximum number of players to return (defaults to 10)
   * @param offset - The number of players to skip (defaults to 0)
   * @param orderDirection
   * @returns A list of players
   * @throws Will throw an error if the field is invalid or the direction is not 'ASC' or 'DESC'
   */
  static async getPlayers(
    db: DrizzleDb,
    limit: number = 10,
    offset: number = 0,
    orderDirection: SQL<unknown>,
  ) {
    try {
      const query = db
        .select()
        .from(playersTable)
        .limit(limit)
        .offset(offset)
        .orderBy(orderDirection);

      const result = await query;

      logger.info("Successfully fetched players", { count: result.length });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to fetch players", { errorMessage });
      throw new Error(`Unable to fetch players: ${errorMessage}`);
    }
  }
}
