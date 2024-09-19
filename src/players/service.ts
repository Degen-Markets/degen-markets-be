import { PlayerEntity, PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";
import { eq, sql, SQL } from "drizzle-orm";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export default class PlayersService {
  private static readonly logger = new Logger({
    serviceName: "PlayersService",
  });
  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  private static async _insertNewOrAwardPoints(
    db: NodePgDatabase,
    playerAddress: string,
    pointsAwarded: number,
  ) {
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

    const player = result[0];

    this.logger.info("Inserted player or updated points of player", {
      player,
    });

    return player;
  }

  /**
   * Inserts a new player or updates the points of an existing player.
   * @param playerAddress - The address of the player to update/insert
   * @param pointsAwarded - The number of points newly awarded to the player
   * @throws Will throw an error if the points awarded is negative
   */
  static insertNewOrAwardPoints = async (
    playerAddress: string,
    pointsAwarded: number,
  ): Promise<PlayerEntity> =>
    this.databaseClient.withDb(async (db) =>
      this._insertNewOrAwardPoints(db, playerAddress, pointsAwarded),
    );

  private static _insertNew = async (
    db: NodePgDatabase,
    player: PlayerInsertEntity,
  ) => {
    const result = await db.insert(playersTable).values(player).returning();
    const updatedPlayer = result[0];
    this.logger.info("Inserted new player", { player: updatedPlayer });
    return updatedPlayer;
  };

  /**
   * Inserts a new player into the database.
   * @param player - The player entity to insert
   * @returns The inserted player entity
   */
  static insertNew = async (player: PlayerInsertEntity) =>
    this.databaseClient.withDb(async (db) => this._insertNew(db, player));

  private static _updateTwitterProfile = async (
    db: NodePgDatabase,
    playerAddress: PlayerEntity["address"],
    twitterProfile: {
      twitterUsername: string;
      twitterPfpUrl: string | null;
      twitterId: string;
    },
  ): Promise<PlayerEntity> => {
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
    return player;
  };

  /**
   * Updates the twitter profile of an existing player.
   * @param playerAddress - The address of the player
   * @param twitterProfile - The new player entity with their twitter details (username & pfpUrl)
   */
  static updateTwitterProfile = async (
    playerAddress: PlayerEntity["address"],
    twitterProfile: {
      twitterUsername: string;
      twitterPfpUrl: string | null;
      twitterId: string;
    },
  ): Promise<PlayerEntity> =>
    this.databaseClient.withDb(async (db) =>
      this._updateTwitterProfile(db, playerAddress, twitterProfile),
    );

  static async _getPlayers(
    db: NodePgDatabase,
    limit: number = 10,
    offset: number = 0,
    orderDirection: SQL<unknown>,
  ) {
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
  }

  /**
   * Retrieves players with pagination and sorting options.
   * @param limit - The maximum number of players to return (defaults to 10)
   * @param offset - The number of players to skip (defaults to 0)
   * @param orderDirection
   * @returns A list of players
   * @throws Will throw an error if the field is invalid or the direction is not 'ASC' or 'DESC'
   */
  static getPlayers = async (
    limit: number = 10,
    offset: number = 0,
    orderDirection: SQL<unknown>,
  ): Promise<PlayerEntity[]> =>
    this.databaseClient.withDb(async (db) =>
      this._getPlayers(db, limit, offset, orderDirection),
    );

  private static _getPlayerByAddress = async (
    db: NodePgDatabase,
    address: PlayerEntity["address"],
  ): Promise<PlayerEntity | null> => {
    const result = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.address, address));

    return result[0] || null; // Return the first result or null if no results found
  };

  /**
   * Fetches player using their address
   * @param address - The id (public address) of the player
   * @returns A single player object from ( playersTable )
   */
  static getPlayerByAddress = async (address: PlayerEntity["address"]) =>
    this.databaseClient.withDb(async (db) =>
      this._getPlayerByAddress(db, address),
    );

  private static _getPlayerByTwitterId = async (
    db: NodePgDatabase,
    twitterId: string,
  ): Promise<PlayerEntity | null> => {
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
    return player;
  };

  /**
   * Fetches a player by their Twitter ID.
   * @param twitterId - The Twitter ID of the player
   * @returns A single player object from playersTable or null if not found
   */
  static getPlayerByTwitterId = async (
    twitterId: string,
  ): Promise<PlayerEntity | null> =>
    this.databaseClient.withDb(async (db) =>
      this._getPlayerByTwitterId(db, twitterId),
    );

  private static _changePoints = async (
    db: NodePgDatabase,
    address: string,
    pointsDelta: number,
  ) => {
    const result = await db
      .update(playersTable)
      .set({ points: sql`${playersTable.points} + ${pointsDelta}` })
      .where(eq(playersTable.address, address))
      .returning();
    const player = result[0];
    this.logger.info("Updated points for player", { player });
    return player;
  };

  /**
   * Changes the points of a player
   * @param address - The address of the player
   * @param pointsDelta - The number of points to add(if number is positive) or subtract(if number is negative)
   * @returns The updated player entity
   */
  static changePoints = async (address: string, pointsDelta: number) =>
    this.databaseClient.withDb(async (db) =>
      this._changePoints(db, address, pointsDelta),
    );
}
