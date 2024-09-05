import { poolEnteredEventHandler } from "../poolEntered";
import PoolEntrantsService from "../../../poolEntrants/service";
import PoolEntriesService from "../../../poolEntries/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";

jest.mock("../../../poolEntrants/service");
jest.mock("../../../poolEntries/service");
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

  it("calls the database services with correct arguments", async () => {
    await poolEnteredEventHandler(mockEventData);

    expect(PoolEntrantsService.insertOrIgnore).toHaveBeenCalledWith(
      mockDb,
      mockEventData.entrant,
    );

    expect(PoolEntriesService.insertOrUpdate).toHaveBeenCalledWith(mockDb, {
      address: mockEventData.entry,
      entrant: mockEventData.entrant,
      option: mockEventData.option,
      pool: mockEventData.pool,
      value: BigInt(mockEventData.value),
    });
  });
});
