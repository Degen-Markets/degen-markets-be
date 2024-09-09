import { asc, desc } from "drizzle-orm";
import { playersTable } from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "clientApi" });

/**
 * Validates the sort parameters for field and direction.
 * @param field - The field to sort by
 * @param direction - The sort direction (ASC or DESC)
 * @throws Will throw an error if the field or direction is invalid
 */
export const validateSortParams = (field: string, direction: string) => {
  if (field !== "points") {
    logger.error("Invalid field provided for sorting", { field });
    throw new Error(`Invalid field: ${field}`);
  }

  if (direction !== "ASC" && direction !== "DESC") {
    logger.error("Invalid sort direction provided", { direction });
    throw new Error(`Invalid direction: ${direction}`);
  }
};

/**
 * Determines the sorting direction for the query.
 * @param direction - The sort direction (ASC or DESC)
 * @returns The appropriate sorting function (asc or desc)
 */
export const getOrderDirection = (direction: string) => {
  return direction === "ASC"
    ? asc(playersTable.points)
    : desc(playersTable.points);
};
