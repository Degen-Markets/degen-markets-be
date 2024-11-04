import poolEnteredEventHandler from "../poolEntered";
import PoolEntriesService from "../../../poolEntries/service";
import PlayersService from "../../../players/service";
import { calculatePointsEarned } from "../utils";
import BN from "bn.js";
import PoolOptionsService from "../../../poolOptions/service";
import PoolsService from "../../../pools/service";
import { timestamp } from "drizzle-orm/mysql-core";

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the database services with correct arguments", async () => {
    const randomPointsEarned = Math.floor(Math.random() * 100);
    mockedCalculatePointsEarned.mockReturnValue(randomPointsEarned);
    const mockedPlayerInsert = jest.fn();
    const mockedEntriesInsert = jest.fn();
    const mockedOptionsUpdate = jest.fn();
    const mockedPoolsUpdate = jest.fn();
    jest
      .spyOn(PlayersService, "insertNewOrAwardPoints")
      .mockImplementation(mockedPlayerInsert);
    jest
      .spyOn(PoolEntriesService, "insertNewOrIncrementValue")
      .mockImplementation(mockedEntriesInsert);
    jest
      .spyOn(PoolOptionsService, "incrementValue")
      .mockImplementation(mockedOptionsUpdate);
    jest
      .spyOn(PoolsService, "incrementValue")
      .mockImplementation(mockedPoolsUpdate);

    await poolEnteredEventHandler(mockEventData, new Date());

    expect(mockedCalculatePointsEarned).toHaveBeenCalledWith(
      new BN(mockEventData.value),
      expect.any(Number),
    );
    expect(mockedPlayerInsert).toHaveBeenCalledWith(
      mockEventData.entrant,
      randomPointsEarned,
    );

    expect(PoolEntriesService.insertNewOrIncrementValue).toHaveBeenCalledWith({
      address: mockEventData.entry,
      entrant: mockEventData.entrant,
      option: mockEventData.option,
      pool: mockEventData.pool,
      value: mockEventData.value,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(PoolOptionsService.incrementValue).toHaveBeenCalledWith(
      mockEventData.option,
      mockEventData.value,
    );

    expect(PoolsService.incrementValue).toHaveBeenCalledWith(
      mockEventData.pool,
      mockEventData.value,
    );
  });
});
