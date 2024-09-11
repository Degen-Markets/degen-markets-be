import { poolEnteredEventHandler } from "../poolEntered";
import PoolEntriesService from "../../../poolEntries/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../../players/service";
import { calculatePointsEarned } from "../utils";
import BN from "bn.js";

jest.mock("../../../players/service");
jest.mock("../../../poolEntries/service");

jest.mock("../utils");
const mockedCalculatePointsEarned = jest.mocked(calculatePointsEarned);

jest.mock("@aws-lambda-powertools/logger");
const logger = jest.mocked(Logger).mock.instances[0] as jest.Mocked<Logger>;

jest.mock("../../../clients/DrizzleClient");
const mockDb = {} as any;
jest.mocked(DrizzleClient.makeDb).mockResolvedValue(mockDb);

describe("poolEnteredEventHandler", () => {
  // randomize mock event data
  const randomChar = Math.random().toString(36).charAt(2);
  const mockEventData = {
    pool: `CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq${randomChar}`,
    option: `7Xd1cKwPkCDcE9ykKmGKuAm3UFXdxHQibGU6U3GkqAWE${randomChar}`,
    entrant: `2rLVMHhvmKZVYBbhTjmGpVXoLv9ZVNJvKTEUxXAEq7Ff${randomChar}`,
    entry: `9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP${randomChar}`,
    value: `100000000000000000${Math.floor(Math.random() * 10)}`,
  };

  beforeEach(() => {
    logger.info.mockClear();
  });

  it("calls the database services with correct arguments", async () => {
    const randomPointsEarned = Math.floor(Math.random() * 100);
    mockedCalculatePointsEarned.mockReturnValue(randomPointsEarned);
    await poolEnteredEventHandler(mockEventData);

    expect(mockedCalculatePointsEarned).toHaveBeenCalledWith(
      new BN(mockEventData.value),
      expect.any(Number),
    );
    expect(PlayersService.insertNewOrAwardPoints).toHaveBeenCalledWith(
      mockDb,
      mockEventData.entrant,
      randomPointsEarned,
    );

    expect(PoolEntriesService.insertNewOrIncrementValue).toHaveBeenCalledWith(
      mockDb,
      {
        address: mockEventData.entry,
        entrant: mockEventData.entrant,
        option: mockEventData.option,
        pool: mockEventData.pool,
        value: mockEventData.value,
      },
    );
  });

  it("logs the correct messages with event data", async () => {
    await poolEnteredEventHandler(mockEventData);

    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, "Processing event", {
      eventData: mockEventData,
    });
    expect(logger.info).toHaveBeenNthCalledWith(
      3,
      "Completed processing event",
      { eventData: mockEventData },
    );
  });
});
