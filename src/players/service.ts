import { PlayerEntity, PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { SQL, sql } from "drizzle-orm";
import BN from "bn.js";
import { eq } from "drizzle-orm";

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
    logger.info("Inserting user into db", { playerAddress, pointsAwarded });
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

    logger.info("Inserted player or updated points of player", {
      player: result[0],
    });
  }

  /**
   * Inserts a new player or updates the points of an existing player.
   * @param db - The database connection
   * @param newPlayer - The new player entity with their twitter details (username & pfpUrl)
   */
  static async insertNewOrSaveTwitterProfile(
    db: DrizzleDb,
    newPlayer: PlayerInsertEntity,
  ): Promise<PlayerEntity> {
    const result = await db
      .insert(playersTable)
      .values(newPlayer)
      .onConflictDoUpdate({
        target: playersTable.address,
        set: {
          twitterUsername: newPlayer.twitterUsername,
          twitterPfpUrl: newPlayer.twitterPfpUrl,
          twitterId: newPlayer.twitterId,
        },
      })
      .returning();
    logger.info("Inserted player or updated their twitter profile", {
      player: result[0],
    });
    return result[0];
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
    } catch (e) {
      logger.error("Failed to fetch players", { error: e });
      throw new Error("Unable to fetch players");
    }
  }

  /**
   * Retrieves players with pagination and sorting options.
   * @param db - The database connection
   * @param playerId - The id (public address) of the player
   * @returns A single player object from ( playersTable )
   */

  static async getPlayerById(db: DrizzleDb, playerId: string) {
    const result = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.address, playerId));

    return result[0] || null; // Return the first result or null if no results found
  }
}
