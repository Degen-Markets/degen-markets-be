import { poolEnteredEventHandler } from "../poolEntered";
import PoolEntriesService from "../../../poolEntries/service";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../../players/service";
import { calculatePointsEarned } from "../utils";
import BN from "bn.js";
import { PlayerEntity } from "../../../players/schema";

jest.mock("../../../poolEntries/service");

jest.mock("../utils");
const mockedCalculatePointsEarned = jest.mocked(calculatePointsEarned);

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
    jest.clearAllMocks();
  });

  it("calls the database services with correct arguments", async () => {
    const randomPointsEarned = Math.floor(Math.random() * 100);
    mockedCalculatePointsEarned.mockReturnValue(randomPointsEarned);
    const mockedInsert = jest.fn();
    jest
      .spyOn(PlayersService, "insertNewOrAwardPoints")
      .mockImplementation(mockedInsert);
    await poolEnteredEventHandler(mockEventData);

    expect(mockedCalculatePointsEarned).toHaveBeenCalledWith(
      new BN(mockEventData.value),
      expect.any(Number),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      mockEventData.entrant,
      randomPointsEarned,
    );

    expect(PoolEntriesService.insertNewOrIncrementValue).toHaveBeenCalledWith({
      address: mockEventData.entry,
      entrant: mockEventData.entrant,
      option: mockEventData.option,
      pool: mockEventData.pool,
      value: mockEventData.value,
    });
  });

  it("logs the correct messages with event data", async () => {
    const dummyPlayer: PlayerEntity = {
      address: "randomChar",
      points: 0,
      twitterId: null,
      twitterPfpUrl: null,
      twitterUsername: null,
    };
    jest
      .spyOn(PlayersService, "insertNewOrAwardPoints")
      .mockResolvedValue(dummyPlayer);

    const logSpy = jest.fn();
    jest.spyOn(Logger.prototype, "info").mockImplementation(logSpy);

    await poolEnteredEventHandler(mockEventData);

    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy).toHaveBeenNthCalledWith(1, "Processing event", {
      eventData: mockEventData,
    });
    expect(logSpy).toHaveBeenNthCalledWith(3, "Completed processing event", {
      eventData: mockEventData,
    });
  });
});
