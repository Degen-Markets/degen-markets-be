import optionCreatedEventHandler from "../optionCreated";
import PoolOptionsService from "../../../poolOptions/service";

describe("optionCreated", () => {
  const dummyEvent = {
    poolAccount: "1XBH...",
    option: "2DY...",
    title: "> $2 Billion",
  };
  it("should create a new option", async () => {
    const mockCreateFn = jest.fn();
    jest
      .spyOn(PoolOptionsService, "createNewOption")
      .mockImplementation(mockCreateFn);
    await optionCreatedEventHandler(dummyEvent);
    expect(mockCreateFn).toHaveBeenCalledWith({
      address: dummyEvent.option,
      pool: dummyEvent.poolAccount,
      title: dummyEvent.title,
    });
  });

  it("should throw an error if option creation fails", async () => {
    const mockedError = new Error("Option Creation failed!");
    jest
      .spyOn(PoolOptionsService, "createNewOption")
      .mockRejectedValue(mockedError);
    try {
      await optionCreatedEventHandler(dummyEvent);
    } catch (e) {
      expect(e).toEqual(mockedError);
    }
  });
});
