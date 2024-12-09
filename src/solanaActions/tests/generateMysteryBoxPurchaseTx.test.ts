import { APIGatewayProxyEventV2 } from "aws-lambda";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { connection } from "../../clients/SolanaProgramClient";
import generateMysteryBoxPurchaseTx from "../generateMysteryBoxPurchaseTx";
import { _Utils } from "../../utils/serializedMysteryBoxTx";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

jest.mock("../../utils/serializedMysteryBoxTx");
jest.mock("@aws-lambda-powertools/logger");

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
  const count = "1";

  const mockEvent = (params: {
    count?: string;
    account?: string;
  }): APIGatewayProxyEventV2 =>
    ({
      queryStringParameters: params.count ? { count: params.count } : {},
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
    const mockLamports = BigInt(Number(count) * 0.02 * LAMPORTS_PER_SOL);
    const mockEventData = mockEvent({
      count,
      account: mockBuyerAddress,
    });
    const mockPayload = {
      transaction: "mockTransaction",
      message: "Success",
      type: "transaction" as const,
    };

    // Mock dependencies
    jest
      .spyOn(connection, "getBalance")
      .mockResolvedValue(Number(mockLamports));
    jest
      .spyOn(_Utils, "serializeMysteryBoxPurchaseTx")
      .mockResolvedValue(mockPayload);

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(_Utils.serializeMysteryBoxPurchaseTx).toHaveBeenCalledWith({
      amountLamports: mockLamports,
      buyer: new PublicKey(mockBuyerAddress),
    });

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error for insufficient balance", async () => {
    const mockEventData = mockEvent({
      count: "1",
      account: mockBuyerAddress,
    });

    jest.spyOn(connection, "getBalance").mockResolvedValue(100_000_00);

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: `Insufficient balance! Required: 0.02 SOL, Available: ${100_000_00 / LAMPORTS_PER_SOL} SOL`,
      }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error for missing account parameter", async () => {
    const mockEventData = mockEvent({
      count: "1",
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Account address is required to process the transaction.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error for invalid amount format", async () => {
    const mockEventData = mockEvent({
      count: "invalid", // Invalid amount
      account: mockBuyerAddress,
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid amount: NaN",
      }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error for zero amount", async () => {
    const mockEventData = mockEvent({
      count: "0",
      account: mockBuyerAddress,
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid amount: 0",
      }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });
});
