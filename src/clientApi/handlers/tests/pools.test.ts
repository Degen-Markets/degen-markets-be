import { APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildInternalServerError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import PoolsService from "../../../pools/service";
import { getAllPools } from "../pools";

jest.mock("../../../pools/service");

const MockedPoolsService = jest.mocked(PoolsService);

const mockPools = [
  {
    address: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
    title: "Pool 1",
    description: "Description for Pool 1",
    image: "https://example.com/pool1.jpg",
    isPaused: false,
    value: "1000",
    createdAt: new Date("2023-01-01"),
  },
  {
    address: "15RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i8z",
    title: "Pool 2",
    description: "Description for Pool 2",
    image: "https://example.com/pool1.jpg",
    isPaused: true,
    value: "2000",
    createdAt: new Date("2023-02-01"),
  },
];

describe("getPools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all pools successfully", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPools);

    const result: APIGatewayProxyResultV2 = await getAllPools();

    expect(MockedPoolsService.getAllPools).toHaveBeenCalled();
    expect(result).toEqual(buildOkResponse(mockPools));
  });

  it("returns error on database access failure", async () => {
    MockedPoolsService.getAllPools.mockRejectedValue(
      new Error("Database error"),
    );

    const result: APIGatewayProxyResultV2 = await getAllPools();

    expect(MockedPoolsService.getAllPools).toHaveBeenCalled();
    expect(result).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });
});
