import { PublicKey, Transaction } from "@solana/web3.js";

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

describe("claimWinTx", () => {
  const MOCK_KEYS = {
    pool: "9ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH",
    option: "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH",
    winner: "3ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH",
    entry: "7ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYv6hRRHh5YH",
  };

  const MOCK_BLOCKHASH = "GHtXQBsoZHVnNFa9YhE4YHNSNsCFiWqk3q5g9VXz4RG";

  const createMockEventData = (isClaimed = false) => ({
    address: MOCK_KEYS.entry,
    isClaimed,
    entrant: MOCK_KEYS.winner,
    option: MOCK_KEYS.option,
    pool: MOCK_KEYS.pool,
    value: "1000",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createErrorResponse = (message: string) => ({
    statusCode: 400,
    body: JSON.stringify({ message }),
    headers: actionUtils.ACTIONS_CORS_HEADERS,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    const mockTransaction = new Transaction();

    (entryUtils.deriveEntryAccountKey as jest.Mock).mockReturnValue(
      new PublicKey(MOCK_KEYS.entry),
    );

    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue(
      createMockEventData(),
    );

    (connection.getLatestBlockhash as jest.Mock).mockResolvedValue({
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: 123456,
    });

    const mockTransactionPromise = Promise.resolve(mockTransaction);
    const mockAccountsPartial = jest.fn().mockReturnValue({
      transaction: jest.fn().mockReturnValue(mockTransactionPromise),
    });

    (program.methods.claimWin as jest.Mock).mockReturnValue({
      accountsPartial: mockAccountsPartial,
    });

    (actionUtils.createPostResponse as jest.Mock).mockResolvedValue({
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

    (actionUtils.createPostResponse as jest.Mock).mockResolvedValue(
      mockPayload,
    );

    const response = await claimWinTx(
      MOCK_KEYS.pool,
      MOCK_KEYS.option,
      MOCK_KEYS.winner,
    );

    expect(entryUtils.deriveEntryAccountKey).toHaveBeenCalledWith(
      new PublicKey(MOCK_KEYS.option),
      new PublicKey(MOCK_KEYS.winner),
    );

    expect(PoolEntriesService.getByAddress).toHaveBeenCalledWith(
      MOCK_KEYS.entry,
    );

    expect(program.methods.claimWin().accountsPartial).toHaveBeenCalledWith({
      poolAccount: new PublicKey(MOCK_KEYS.pool),
      optionAccount: new PublicKey(MOCK_KEYS.option),
      entryAccount: new PublicKey(MOCK_KEYS.entry),
      winner: new PublicKey(MOCK_KEYS.winner),
    });

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: actionUtils.ACTIONS_CORS_HEADERS,
    });
  });

  it("should return error if entry does not exist", async () => {
    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue(null);

    const response = await claimWinTx(
      MOCK_KEYS.pool,
      MOCK_KEYS.option,
      MOCK_KEYS.winner,
    );

    expect(response).toEqual(createErrorResponse("You did not win this bet!"));
  });

  it("should return error if entry is already claimed", async () => {
    (PoolEntriesService.getByAddress as jest.Mock).mockResolvedValue(
      createMockEventData(true),
    );

    const response = await claimWinTx(
      MOCK_KEYS.pool,
      MOCK_KEYS.option,
      MOCK_KEYS.winner,
    );

    expect(response).toEqual(
      createErrorResponse("You have already claimed this bet!"),
    );
  });

  it("should handle program transaction errors", async () => {
    (program.methods.claimWin as jest.Mock).mockReturnValue({
      accountsPartial: jest.fn().mockReturnValue({
        transaction: jest
          .fn()
          .mockRejectedValue(new Error("Transaction failed")),
      }),
    });

    const response = await claimWinTx(
      MOCK_KEYS.pool,
      MOCK_KEYS.option,
      MOCK_KEYS.winner,
    );

    expect(response).toEqual(createErrorResponse("You did not win this bet!"));
  });
});
