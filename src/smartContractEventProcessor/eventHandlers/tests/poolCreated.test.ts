import poolCreatedEventHandler from "../poolCreated";
import PoolsService from "../../../pools/service";

describe("poolCreated", () => {
  const dummyEvent = {
    poolAccount: "ABC...",
    title: "What will be the max mcap of $MOG in 2025?",
    imageUrl: "https://example.com",
    description:
      "Maximum market capitalisation reached on a 1 day daily close on a major exchange",
  };
  it("should create a new pool", async () => {
    const mockedCreateFn = jest.fn();
    jest
      .spyOn(PoolsService, "createNewPool")
      .mockImplementation(mockedCreateFn);
    await poolCreatedEventHandler(dummyEvent);
    expect(mockedCreateFn).toHaveBeenCalledWith({
      address: dummyEvent.poolAccount,
      title: dummyEvent.title,
      image: dummyEvent.imageUrl,
      description: dummyEvent.description,
    });
  });

  it("should throw an error if pool creation fails", async () => {
    const mockedError = new Error("Creating Pool failed!");
    jest.spyOn(PoolsService, "createNewPool").mockRejectedValue(mockedError);
    try {
      await poolCreatedEventHandler(dummyEvent);
    } catch (e) {
      expect(e).toEqual(mockedError);
    }
  });
});
