import { PlayerEntity, PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { eq, sql, SQL } from "drizzle-orm";
import { DatabaseClient } from "../clients/DatabaseClient";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export default class PlayersService {
  private readonly logger = new Logger({
    serviceName: "PlayersService",
  });
  async makeDb(): Promise<{ db: DrizzleDb; connection: Client }> {
    const dbClient = new DatabaseClient();
    const connection = await dbClient.createConnection();
    const db = drizzle(connection);
    return {
      db,
      connection,
    };
  }
  /**
   * Inserts a new player or updates the points of an existing player.
   * @param playerAddress - The address of the player to update/insert
   * @param pointsAwarded - The number of points newly awarded to the player
   * @throws Will throw an error if the points awarded is negative
   */
  async insertNewOrAwardPoints(playerAddress: string, pointsAwarded: number) {
    const { db, connection } = await this.makeDb();
    this.logger.info("Inserting user into db", {
      playerAddress,
      pointsAwarded,
    });
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

    this.logger.info("Inserted player or updated points of player", {
      player: result[0],
    });

    await connection.end();
  }

  /**
   * Inserts a new player into the database.
   * @param player - The player entity to insert
   * @returns The inserted player entity
   */
  async insertNew(player: PlayerInsertEntity) {
    const { db, connection } = await this.makeDb();
    const result = await db.insert(playersTable).values(player).returning();
    const updatedPlayer = result[0];
    this.logger.info("Inserted new player", { player: updatedPlayer });
    await connection.end();
    return updatedPlayer;
  }

  /**
   * Updates the twitter profile of an existing player.
   * @param playerAddress - The address of the player
   * @param twitterProfile - The new player entity with their twitter details (username & pfpUrl)
   */
  async updateTwitterProfile(
    playerAddress: PlayerEntity["address"],
    twitterProfile: {
      twitterUsername: string;
      twitterPfpUrl: string | null;
      twitterId: string;
    },
  ) {
    const { db, connection } = await this.makeDb();
    const result = await db
      .update(playersTable)
      .set({
        twitterUsername: twitterProfile.twitterUsername,
        twitterPfpUrl: twitterProfile.twitterPfpUrl,
        twitterId: twitterProfile.twitterId,
      })
      .where(eq(playersTable.address, playerAddress))
      .returning();
    const player = result[0];
    this.logger.info("Updated player's twitter profile", {
      player,
    });
    await connection.end();
    return player;
  }

  /**
   * Retrieves players with pagination and sorting options.
   * @param limit - The maximum number of players to return (defaults to 10)
   * @param offset - The number of players to skip (defaults to 0)
   * @param orderDirection
   * @returns A list of players
   * @throws Will throw an error if the field is invalid or the direction is not 'ASC' or 'DESC'
   */
  async getPlayers(
    limit: number = 10,
    offset: number = 0,
    orderDirection: SQL<unknown>,
  ) {
    const { db, connection } = await this.makeDb();
    try {
      const query = db
        .select()
        .from(playersTable)
        .limit(limit)
        .offset(offset)
        .orderBy(orderDirection);

      const result = await query;

      this.logger.info("Successfully fetched players", {
        count: result.length,
      });

      return result;
    } catch (e) {
      this.logger.error("Failed to fetch players", { error: e });
      throw new Error("Unable to fetch players");
    } finally {
      await connection.end();
    }
  }

  /**
   * Fetches player using their address
   * @param address - The id (public address) of the player
   * @returns A single player object from ( playersTable )
   */

  async getPlayerByAddress(
    address: PlayerEntity["address"],
  ): Promise<PlayerEntity | null> {
    const { db, connection } = await this.makeDb();
    const result = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.address, address));
    await connection.end();

    return result[0] || null; // Return the first result or null if no results found
  }

  /**
   * Fetches a player by their Twitter ID.
   * @param twitterId - The Twitter ID of the player
   * @returns A single player object from playersTable or null if not found
   */
  async getPlayerByTwitterId(twitterId: string): Promise<PlayerEntity | null> {
    const { db, connection } = await this.makeDb();
    const players = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.twitterId, twitterId));

    const player = players[0];
    if (!player) {
      this.logger.info("No player found with the given Twitter ID", {
        twitterId,
      });
      return null;
    }

    this.logger.info("Successfully fetched player by Twitter ID", { player });
    await connection.end();
    return player;
  }

  /**
   * Changes the points of a player
   * @param address - The address of the player
   * @param pointsDelta - The number of points to add(if number is positive) or subtract(if number is negative)
   * @returns The updated player entity
   */
  async changePoints(address: string, pointsDelta: number) {
    const { db, connection } = await this.makeDb();
    const result = await db
      .update(playersTable)
      .set({ points: sql`${playersTable.points} + ${pointsDelta}` })
      .where(eq(playersTable.address, address))
      .returning();
    const player = result[0];
    this.logger.info("Updated points for player", { player });
    await connection.end();
    return player;
  }
}
