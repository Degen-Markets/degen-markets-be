import poolStatusUpdatedEventHandler from "../poolStatusUpdate";
import PoolsService from "../../../pools/service";
import { SmartContractEventData } from "../../types";

describe("poolStatusUpdate", () => {
  let mockedPoolStatusUpdateEventData: SmartContractEventData<"poolStatusUpdated">;
  let spiedSetIsPausePool: jest.SpyInstance;

  beforeEach(() => {
    mockedPoolStatusUpdateEventData = {
      pool: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
      isPaused: true,
    };

    spiedSetIsPausePool = jest
      .spyOn(PoolsService, "setIsPausedPool")
      .mockResolvedValue({
        address: mockedPoolStatusUpdateEventData.pool,
        isPaused: mockedPoolStatusUpdateEventData.isPaused,
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
    await poolStatusUpdatedEventHandler(mockedPoolStatusUpdateEventData);

    expect(spiedSetIsPausePool).toHaveBeenCalledWith(
      mockedPoolStatusUpdateEventData.isPaused,
      mockedPoolStatusUpdateEventData.pool,
    );
  });
});
