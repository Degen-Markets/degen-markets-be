import winClaimedEventHandler from "../winClaimed";
import PoolEntriesService from "../../../poolEntries/service";
import { SmartContractEventData } from "../../types";

describe("winClaimedEventHandler", () => {
  it("should call winClaimed and set isClaimed to true for the entry", async () => {
    const mockWinClaimedEventData: SmartContractEventData<"winClaimed"> = {
      entry: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
      pool: "PoolAddress",
      winner: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
    };

    const spiedWinClaimed = jest
      .spyOn(PoolEntriesService, "claimWin")
      .mockResolvedValue({
        address: "",
        entrant: "",
        option: "",
        pool: "",
        value: "",
        isClaimed: true,
      });

    await winClaimedEventHandler(mockWinClaimedEventData);

    expect(spiedWinClaimed).toHaveBeenCalledWith(mockWinClaimedEventData.entry);
  });
});
