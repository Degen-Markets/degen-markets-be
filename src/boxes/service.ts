import { desc, eq, and, sql } from "drizzle-orm";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { BoxEntity, boxesTable, BoxInsertEntity } from "./schema";

export default class MysteryBoxServices {
  private static readonly logger = new Logger({
    serviceName: "mysteryBoxServices",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static getUnopenedBoxesForPlayer = async (
    player: string,
  ): Promise<BoxEntity[]> => {
    this.logger.info(`Fetching unopened boxes for player: ${player}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const boxes = await db
        .select()
        .from(boxesTable)
        .where(
          and(eq(boxesTable.player, player), eq(boxesTable.isOpened, false)),
        )
        .orderBy(desc(boxesTable.createdAt));

      this.logger.info(
        `Found ${boxes.length} unopened boxes for player ${player}`,
      );
      return boxes;
    });
  };

  static openBox = async (
    player: string,
    boxId: string,
  ): Promise<BoxEntity> => {
    this.logger.info(`Opening box ${boxId} for player ${player}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      // First, verify the box exists and belongs to the player
      const existingBox = await db
        .select()
        .from(boxesTable)
        .where(and(eq(boxesTable.id, boxId), eq(boxesTable.player, player)))
        .limit(1)
        .execute(); // initial SELECT check

      if (!existingBox[0]) {
        this.logger.error(`Box ${boxId} not found for player ${player}`);
        throw new Error(`Box ${boxId} not found for player ${player}`);
      }

      if (existingBox[0].isOpened) {
        this.logger.error(`Box ${boxId} has already been opened`);
        throw new Error(`Box ${boxId} has already been opened`);
      }

      const result = await db
        .update(boxesTable)
        .set({
          isOpened: true,
          openedAt: new Date(),
        })
        .where(
          and(
            eq(boxesTable.id, boxId),
            eq(boxesTable.player, player),
            eq(boxesTable.isOpened, false),
          ),
        )
        .returning();

      const updatedBox = result[0];
      if (!updatedBox) {
        this.logger.error(`Failed to open box ${boxId} for player ${player}`);
        throw new Error("Failed to open box");
      }

      this.logger.info(`Successfully opened box ${boxId} for player ${player}`);
      return updatedBox;
    });
  };

  static createBox = async (input: BoxInsertEntity): Promise<BoxEntity> => {
    this.logger.info(`Creating new box for player: ${input.player}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db.insert(boxesTable).values(input).returning();

      const box = result[0];
      if (!box) {
        this.logger.error(`Failed to create box for player ${input.player}`);
        throw new Error("Failed to create box");
      }

      return box;
    });
  };
}
