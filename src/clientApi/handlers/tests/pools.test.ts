import { APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from "aws-lambda";
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
    token: "",
  },
  {
    address: "15RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i8z",
    title: "Pool 2",
    description: "Description for Pool 2",
    image: "https://example.com/pool1.jpg",
    isPaused: true,
    value: "2000",
    createdAt: new Date("2023-02-01"),
    token: "",
  },
];

describe("getAllPools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvent = (queryParams: any = {}): APIGatewayProxyEventV2 =>
    ({
      queryStringParameters: queryParams,
    }) as APIGatewayProxyEventV2;

  it("returns all pools successfully with no filters (default)", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPools);

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
    );
    expect(result).toEqual(buildOkResponse(mockPools));
  });

  it("returns ongoing pools successfully", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPools);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ status: "ongoing" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "ongoing",
      "newest",
      false,
    );
    expect(result).toEqual(buildOkResponse(mockPools));
  });

  it("returns paused pools when no ongoing pools are found and applyPausedFallback is true", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue([]);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ status: "ongoing", applyPausedFallback: "true" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "ongoing",
      "newest",
      true,
    );
    expect(result).toEqual(buildOkResponse([]));
  });

  it("returns pools sorted by highest volume", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPools);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ sortBy: "highestVolume" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "highestVolume",
      false,
    );
    expect(result).toEqual(buildOkResponse(mockPools));
  });

  it("returns error on database access failure", async () => {
    MockedPoolsService.getAllPools.mockRejectedValue(
      new Error("Database error"),
    );

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
    );
    expect(result).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });
});
