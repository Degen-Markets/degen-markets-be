import { DrizzleDb } from "../clients/DrizzleClient";
import { poolEntrantsTable } from "./schema";

namespace PoolEntrantsService {
  export async function insertOrIgnore(db: DrizzleDb, address: string) {
    await db
      .insert(poolEntrantsTable)
      .values({ address })
      .onConflictDoNothing();
  }
}

export default PoolEntrantsService;
