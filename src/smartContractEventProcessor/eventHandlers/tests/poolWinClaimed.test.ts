import winClaimedEventHandler from "../winClaimed";
import PoolEntriesService from "../../../poolEntries/service";
import { SmartContractEventData } from "../../types";

describe("winClaimedEventHandler", () => {
  let mockWinClaimedEventData: SmartContractEventData<"winClaimed">;
  let spiedWinClaimed: jest.SpyInstance;

  beforeEach(() => {
    mockWinClaimedEventData = {
      entry: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
      pool: "PoolAddress",
      winner: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
    };

    spiedWinClaimed = jest
      .spyOn(PoolEntriesService, "winClaimed")
      .mockResolvedValue({
        address: "",
        entrant: "",
        option: "",
        pool: "",
        value: "",
        isClaimed: true,
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call winClaimed and set isClaimed to true for the entry", async () => {
    await winClaimedEventHandler(mockWinClaimedEventData);

    expect(spiedWinClaimed).toHaveBeenCalledWith(mockWinClaimedEventData.entry);

    const result = await PoolEntriesService.winClaimed(
      mockWinClaimedEventData.entry,
    );
    expect(result).toEqual({
      address: "",
      entrant: "",
      option: "",
      pool: "",
      value: "",
      isClaimed: true,
    });
  });
});
