import poolPausedEventHandler from "../poolPaused";
import PoolsService from "../../../pools/service";
import { PoolPausedEventData } from "../../../smartContractEventProcessor/types";

describe("poolPaused", () => {
  let mockedPoolPausedEventData: PoolPausedEventData;
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

    // Check that both the pool address and isPaused were passed
    expect(spiedPausePool).toHaveBeenCalledWith(
      mockedPoolPausedEventData.isPaused,
      mockedPoolPausedEventData.pool,
    );
  });

  it("should resume the pool", async () => {
    mockedPoolPausedEventData.isPaused = false;

    await poolPausedEventHandler(mockedPoolPausedEventData);

    // Check that both the pool address and isPaused were passed
    expect(spiedPausePool).toHaveBeenCalledWith(
      mockedPoolPausedEventData.isPaused,
      mockedPoolPausedEventData.pool,
    );
  });
});
