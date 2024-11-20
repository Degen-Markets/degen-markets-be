import { PublicKey, Transaction } from "@solana/web3.js";
import { ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Logger } from "@aws-lambda-powertools/logger";
import * as actionUtils from "@solana/actions";
import * as entryUtils from "../../poolEntries/utils";
import PoolEntriesService from "../../poolEntries/service";
import { connection, program } from "../../clients/SolanaProgramClient";
import { claimWinTx } from "../claimWinTx";

jest.mock("../../poolEntries/service");
jest.mock("../../clients/SolanaProgramClient");
jest.mock("@aws-lambda-powertools/logger");
jest.mock("../../poolEntries/utils");
jest.mock("@solana/actions");

const mockPoolAccountKey = "9ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH";
const mockOptionAccountKey = "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH";
const mockWinnerAccountKey = "3ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH";
const mockEntryAccountKey = "7ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH";
const mockBlockhash = "GHtXQBsoZHVnNFa9YhE4YHNSNsCFiWqk3q5g9VXz4RG";

describe("claimWinTx", () => {
  let mockTransaction: Transaction;

  const mockEventData = {
    address: mockEntryAccountKey,
    isClaimed: false,
    entrant: mockWinnerAccountKey,
    option: mockOptionAccountKey,
    pool: mockPoolAccountKey,
    value: "1000",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (entryUtils.deriveEntryAccountKey as jest.Mock).mockReturnValue(
      new PublicKey(mockEntryAccountKey),
    );

    mockTransaction = new Transaction();

    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue(
      mockEventData,
    );

    (connection.getLatestBlockhash as jest.Mock).mockResolvedValue({
      blockhash: mockBlockhash,
      lastValidBlockHeight: 123456,
    });

    const mockTransactionPromise = Promise.resolve(mockTransaction);
    const mockAccountsPartial = jest.fn().mockReturnValue({
      transaction: jest.fn().mockReturnValue(mockTransactionPromise),
    });

    (program.methods.claimWin as jest.Mock).mockReturnValue({
      accountsPartial: mockAccountsPartial,
    });

    (createPostResponse as jest.Mock).mockResolvedValue({
      transaction: mockTransaction,
      type: "transaction",
    });
  });

  it("should successfully generate a claim win transaction", async () => {
    const mockPayload = {
      transaction: "mockTransaction",
      message: "Success",
      type: "transaction" as const,
    };

    jest
      .spyOn(PoolEntriesService, "getByAddress")
      .mockResolvedValue(mockEventData);

    jest
      .spyOn(entryUtils, "deriveEntryAccountKey")
      .mockReturnValue(new PublicKey(mockEntryAccountKey));

    jest
      .spyOn(actionUtils, "createPostResponse")
      .mockResolvedValue(mockPayload);

    jest.spyOn(connection, "getLatestBlockhash").mockResolvedValue({
      blockhash: "mockBlockhash",
      lastValidBlockHeight: 123,
    });

    const mockTransaction = new Transaction();

    const mockClaimWin = jest.fn().mockReturnValue({
      accountsPartial: jest.fn().mockReturnValue({
        transaction: jest.fn().mockResolvedValue(mockTransaction),
      }),
    });

    program.methods.claimWin = mockClaimWin;

    const response = await claimWinTx(
      mockPoolAccountKey,
      mockOptionAccountKey,
      mockWinnerAccountKey,
    );

    expect(entryUtils.deriveEntryAccountKey).toHaveBeenCalledWith(
      new PublicKey(mockOptionAccountKey),
      new PublicKey(mockWinnerAccountKey),
    );

    expect(PoolEntriesService.getByAddress).toHaveBeenCalledWith(
      mockEntryAccountKey,
    );

    expect(mockClaimWin).toHaveBeenCalled();
    expect(mockClaimWin().accountsPartial).toHaveBeenCalledWith({
      poolAccount: new PublicKey(mockPoolAccountKey),
      optionAccount: new PublicKey(mockOptionAccountKey),
      entryAccount: new PublicKey(mockEntryAccountKey),
      winner: new PublicKey(mockWinnerAccountKey),
    });

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error if entry does not exist", async () => {
    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue(null);

    const response = await claimWinTx(
      mockPoolAccountKey,
      mockOptionAccountKey,
      mockWinnerAccountKey,
    );

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "You did not win this bet!" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error if entry is already claimed", async () => {
    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue({
      address: mockEntryAccountKey,
      isClaimed: true,
      entrant: mockWinnerAccountKey,
      option: mockOptionAccountKey,
      pool: mockPoolAccountKey,
      value: "1000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await claimWinTx(
      mockPoolAccountKey,
      mockOptionAccountKey,
      mockWinnerAccountKey,
    );

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "You have already claimed this bet!" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should handle program transaction errors", async () => {
    const mockError = new Error("Transaction failed");
    (program.methods.claimWin as jest.Mock).mockReturnValue({
      accountsPartial: jest.fn().mockReturnValue({
        transaction: jest.fn().mockRejectedValue(mockError),
      }),
    });

    const response = await claimWinTx(
      mockPoolAccountKey,
      mockOptionAccountKey,
      mockWinnerAccountKey,
    );

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "You did not win this bet!" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("should properly set transaction properties", async () => {
    await claimWinTx(
      mockPoolAccountKey,
      mockOptionAccountKey,
      mockWinnerAccountKey,
    );

    expect(createPostResponse).toHaveBeenCalledWith({
      fields: {
        type: "transaction",
        transaction: expect.objectContaining({
          feePayer: expect.any(PublicKey),
          recentBlockhash: mockBlockhash,
        }),
      },
    });
  });
});
