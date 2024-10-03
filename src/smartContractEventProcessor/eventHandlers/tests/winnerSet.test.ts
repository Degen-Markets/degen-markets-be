import PoolOptionsService from "../../../poolOptions/service";
import winnerSetEventHandler from "../winnerSet";

describe("winnerSetEventHandler", () => {
  it("sets the winning option on PoolOptionsService", async () => {
    const spiedSetWinner = jest
      .spyOn(PoolOptionsService, "setWinner")
      .mockResolvedValue(undefined as any); // the return value is unused

    const mockEventData = {
      pool: "mockPool",
      option: "mockOption",
    };

    await winnerSetEventHandler(mockEventData);

    expect(spiedSetWinner).toHaveBeenCalledWith({
      poolAddress: mockEventData.pool,
      winningOptionAddress: mockEventData.option,
    });
  });
});
