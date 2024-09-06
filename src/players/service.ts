import { PlayerInsertEntity } from "./types";
import { playersTable } from "./schema";
import { DrizzleDb } from "../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({
  serviceName: "PlayersService",
});

export default class PlayersService {
  static async upsert(db: DrizzleDb, data: PlayerInsertEntity) {
    const result = await db
      .insert(playersTable)
      .values(data)
      .onConflictDoUpdate({
        target: playersTable.address,
        set: data,
      })
      .returning();

    logger.debug("Upserted player", { player: result[0] });
  }
}
