import solTransferredEventHandler from "../solTransfer";
import MysteryBoxServices from "../../../boxes/service";
import { SmartContractEventData } from "../../types";

jest.mock("../../../boxes/service");
const mockMysteryBoxServices = MysteryBoxServices as jest.Mocked<
  typeof MysteryBoxServices
>;

describe("solTransferredEventHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a mystery box when receiving a valid SOL transfer event", async () => {
    const mockEventData: SmartContractEventData<"solTransferred"> = {
      amount: "1.5",
      sender: "testWalletAddress123",
    };

    const mockCreatedBox = {
      id: "box123",
      player: mockEventData.sender,
      isOpened: false,
      createdAt: new Date(),
      openedAt: null,
      winningToken: null,
      winningAmount: null,
    };

    mockMysteryBoxServices.createBox.mockResolvedValueOnce(mockCreatedBox);

    await solTransferredEventHandler(mockEventData);

    expect(mockMysteryBoxServices.createBox).toHaveBeenCalledWith({
      player: mockEventData.sender,
      isOpened: false,
      createdAt: expect.any(Date),
    });

    expect(mockMysteryBoxServices.createBox).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if box creation fails", async () => {
    const mockEventData: SmartContractEventData<"solTransferred"> = {
      amount: "1.5",
      sender: "testWalletAddress123",
    };

    const mockError = new Error("Failed to create box");
    mockMysteryBoxServices.createBox.mockRejectedValueOnce(mockError);

    await expect(solTransferredEventHandler(mockEventData)).rejects.toThrow(
      "Failed to create box",
    );
  });

  it("should handle empty sender address", async () => {
    const mockEventData: SmartContractEventData<"solTransferred"> = {
      amount: "1.5",
      sender: "",
    };

    const mockCreatedBox = {
      id: "box123",
      player: "",
      isOpened: false,
      createdAt: new Date(),
      openedAt: null,
      winningToken: null,
      winningAmount: null,
    };

    mockMysteryBoxServices.createBox.mockResolvedValueOnce(mockCreatedBox);

    await solTransferredEventHandler(mockEventData);

    expect(mockMysteryBoxServices.createBox).toHaveBeenCalledWith({
      player: "",
      isOpened: false,
      createdAt: expect.any(Date),
    });
  });
});
