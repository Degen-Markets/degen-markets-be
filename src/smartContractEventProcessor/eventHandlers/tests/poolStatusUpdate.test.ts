import poolStatusUpdatedEventHandler from "../poolStatueUpdate";
import PoolsService from "../../../pools/service";
import { SmartContractEventData } from "../../types";

describe("poolStatusUpdate", () => {
  let mockedPoolStatueUpdateEventData: SmartContractEventData<"poolStatusUpdated">;
  let spiedSetIsPausePool: jest.SpyInstance;

  beforeEach(() => {
    mockedPoolStatueUpdateEventData = {
      pool: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
      isPaused: true,
    };

    spiedSetIsPausePool = jest
      .spyOn(PoolsService, "setIsPausedPool")
      .mockResolvedValue({
        address: mockedPoolStatueUpdateEventData.pool,
        isPaused: mockedPoolStatueUpdateEventData.isPaused,
        value: "",
        title: "",
        description: "",
        image: "",
        createdAt: new Date(),
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should pause the pool", async () => {
    await poolStatusUpdatedEventHandler(mockedPoolStatueUpdateEventData);

    expect(spiedSetIsPausePool).toHaveBeenCalledWith(
      mockedPoolStatueUpdateEventData.isPaused,
      mockedPoolStatueUpdateEventData.pool,
    );
  });
});
