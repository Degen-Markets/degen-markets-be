import poolPausedEventHandler from "../poolPaused";
import PoolsService from "../../../pools/service";
import { SmartContractEventData } from "../../../smartContractEventProcessor/types";

describe("poolPaused", () => {
  let mockedPoolPausedEventData: SmartContractEventData<"poolStatusUpdated">;
  let spiedPausePool: jest.SpyInstance;

  beforeEach(() => {
    mockedPoolPausedEventData = {
      pool: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
      isPaused: true,
    };

    spiedPausePool = jest.spyOn(PoolsService, "pausePool").mockResolvedValue({
      address: mockedPoolPausedEventData.pool,
      isPaused: mockedPoolPausedEventData.isPaused,
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
    await poolPausedEventHandler(mockedPoolPausedEventData);

    expect(spiedPausePool).toHaveBeenCalledWith(
      mockedPoolPausedEventData.isPaused,
      mockedPoolPausedEventData.pool,
    );
  });
});
