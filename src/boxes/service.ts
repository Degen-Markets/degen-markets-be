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
      const result = await db
        .update(boxesTable)
        .set({
          isOpened: true,
          openedAt: sql`CURRENT_TIMESTAMP`,
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
