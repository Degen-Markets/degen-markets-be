import { Logger } from "@aws-lambda-powertools/logger";
import { DrizzleDb } from "../clients/DrizzleClient";
import { poolEntrantsTable } from "./schema";

const logger = new Logger({
  serviceName: "PoolEntrantsService",
});

namespace PoolEntrantsService {
  export async function insertOrIgnore(db: DrizzleDb, address: string) {
    const insertedRows = await db
      .insert(poolEntrantsTable)
      .values({ address })
      .onConflictDoNothing()
      .returning();

    const isInserted = insertedRows.length > 0;
    logger.debug(`${isInserted ? "Inserted" : "Ignored"} pool entrant`, {
      poolEntrant: insertedRows[0],
    });
  }
}

export default PoolEntrantsService;
