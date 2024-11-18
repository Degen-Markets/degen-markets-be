import { APIGatewayProxyEventV2 } from "aws-lambda";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { connection } from "../../clients/SolanaProgramClient";
import generateMysteryBoxPurchaseTx from "../generateMysteryBoxPurchaseTx";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { convertSolToLamports } from "../../../lib/utils";

jest.mock("../generateMysteryBoxPurchaseTx");

jest.mock("../../clients/SolanaProgramClient", () => ({
  connection: {
    getBalance: jest.fn(),
    getLatestBlockhash: jest.fn(),
  },
}));

jest.mock("@coral-xyz/anchor", () => ({
  web3: {
    SystemProgram: {
      transfer: jest.fn(),
    },
  },
}));

describe("generateMysteryBoxPurchaseTx", () => {
  const mockBuyerAddress = "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH";
  const mockBlockhash = "GHtXQBsoZHVnNFa9YhE4YHNSNsCFiWqk3q5g9VXz4RG";

  const mockEvent = (params: {
    amountInSol?: string;
    account?: string;
  }): APIGatewayProxyEventV2 =>
    ({
      queryStringParameters: params.amountInSol
        ? { amountInSol: params.amountInSol }
        : {},
      body: JSON.stringify({ account: params.account }),
    }) as APIGatewayProxyEventV2;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (connection.getLatestBlockhash as jest.Mock).mockResolvedValue({
      blockhash: mockBlockhash,
    });

    (anchor.web3.SystemProgram.transfer as jest.Mock).mockReturnValue({
      programId: new PublicKey("11111111111111111111111111111111"),
      keys: [],
      data: Buffer.from([]),
    });
  });

  it("should successfully generate a mystery box purchase transaction", async () => {
    const mockPayload = {
      type: "transaction",
      transaction: "mockTransaction",
      message: "Purchase Mystery Box for 0.02 SOL",
      links: {
        next: {
          type: "inline",
          action: {
            type: "completed",
            label: "Mystery Box Purchased!",
            title: "Mystery Box Purchase completed",
            description: "Successfully Purchased 1 mystery box for 0.02 SOL!",
            icon: "",
          },
        },
      },
    };

    const mockEventData = mockEvent({
      amountInSol: "0.02",
      account: mockBuyerAddress,
    });

    const mockedGenerateMysteryBoxPurchaseTx = jest.mocked(
      generateMysteryBoxPurchaseTx,
    );
    mockedGenerateMysteryBoxPurchaseTx.mockResolvedValueOnce({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: ACTIONS_CORS_HEADERS,
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(mockedGenerateMysteryBoxPurchaseTx).toHaveBeenCalledWith(
      mockEventData,
    );
    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: ACTIONS_CORS_HEADERS,
    });
  });
});
