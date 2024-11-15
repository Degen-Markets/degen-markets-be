import { APIGatewayProxyEventV2 } from "aws-lambda";
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { connection } from "../../clients/SolanaProgramClient";
import { convertSolToLamports } from "../../../lib/utils";
import generateMysteryBoxPurchaseTx from "../generateMysteryBoxPurchaseTx";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

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

jest.mock("@aws-lambda-powertools/logger");

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
    // Mock connection.getBalance to return a sufficient balance
    (connection.getBalance as jest.Mock).mockResolvedValue(
      0.02 * LAMPORTS_PER_SOL,
    );

    (connection.getLatestBlockhash as jest.Mock).mockResolvedValue({
      blockhash: "GHtXQBsoZHVnNFa9YhE4YHNSNsCFiWqk3q5g9VXz4RG",
    });

    const mockEventData = mockEvent({
      amountInSol: "0.02",
      account: mockBuyerAddress,
    });

    const expectedTransaction = {
      type: "transaction",
      transaction:
        "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECQ8Lx6xwF0ev4OpYq2kcrsbc+N2DYKTuSe1DkIIvUruYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPqzs9UrxonUpcr/msVieuuaz1FjQqQPksyh5Jhb/SzAQEAAA==",
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

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual(
      expect.objectContaining({
        statusCode: 200,
        body: JSON.stringify(expectedTransaction),
        headers: undefined,
      }),
    );
  });

  it("should return error for insufficient balance", async () => {
    (connection.getBalance as jest.Mock).mockResolvedValue(
      0.01 * LAMPORTS_PER_SOL,
    );

    const mockEventData = mockEvent({
      amountInSol: "0.02",
      account: mockBuyerAddress,
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual(
      buildBadRequestError(
        "Insufficient balance! Required: 0.02 SOL, Available: 0.01 SOL",
      ),
    );
  });

  it("should return error for missing parameters", async () => {
    const response = await generateMysteryBoxPurchaseTx(mockEvent({}));

    expect(response).toEqual(
      buildBadRequestError(
        "Invalid amount format. Please provide a valid SOL amount.",
      ),
    );
  });

  it("should return error for invalid amount format", async () => {
    const response = await generateMysteryBoxPurchaseTx(
      mockEvent({ amountInSol: "invalid", account: mockBuyerAddress }),
    );

    expect(response).toEqual(
      buildBadRequestError(
        "Invalid amount format. Please provide a valid number.",
      ),
    );
  });

  it("should return error for zero amount", async () => {
    const mockEventData = mockEvent({
      amountInSol: "0",
      account: mockBuyerAddress,
    });

    const response = await generateMysteryBoxPurchaseTx(mockEventData);

    expect(response).toEqual(
      buildBadRequestError(
        "Invalid amount format. Please provide a valid number.",
      ),
    );
  });

  it("should return error if account is missing", async () => {
    const response = await generateMysteryBoxPurchaseTx(
      mockEvent({ amountInSol: "0.02" }),
    );

    expect(response).toEqual(
      buildBadRequestError(
        "Invalid amount format. Please provide a valid SOL amount.",
      ),
    );
  });

  it("handles errors from transaction creation", async () => {
    (connection.getBalance as jest.Mock).mockRejectedValue(
      new Error("Connection error"),
    );

    const response = await generateMysteryBoxPurchaseTx(
      mockEvent({ amountInSol: "0.02", account: mockBuyerAddress }),
    );

    expect(response).toEqual(
      buildInternalServerError(
        "Failed to generate mystery box purchase transaction. Please try again.",
      ),
    );
  });
});
