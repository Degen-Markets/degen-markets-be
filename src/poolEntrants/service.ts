import { DrizzleDb } from "../clients/DrizzleClient";
import { poolEntrantsTable } from "./schema";

export async function insertOrIgnorePoolEntrant(
  db: DrizzleDb,
  address: string,
) {
  await db.insert(poolEntrantsTable).values({ address }).onConflictDoNothing();
}
