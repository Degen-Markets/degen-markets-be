import { APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from "aws-lambda";
import {
  buildInternalServerError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import PoolsService from "../../../pools/service";
import { getAllPools } from "../pools";

jest.mock("../../../pools/service");

const MockedPoolsService = jest.mocked(PoolsService);

const mockPoolsData = [
  {
    address: "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y",
    title: "Pool 1",
    description: "Description for Pool 1",
    image: "https://example.com/pool1.jpg",
    isPaused: false,
    value: "1800",
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

  it("returns all pools successfully with default filters", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("returns ongoing pools successfully", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ status: "ongoing" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "ongoing",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("applies pagination with limit and offset", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ limit: "5", offset: "15" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      5,
      15,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("returns paused pools when applyPausedFallback is true", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue([]);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ status: "ongoing", applyPausedFallback: "true" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "ongoing",
      "newest",
      true,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse([]));
  });

  it("returns pools sorted by highest volume", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ sortBy: "highestVolume" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "highestVolume",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
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
      18,
      0,
    );
    expect(result).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });

  it("returns empty pools array when no pools are found", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue([]);

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse([]));
  });

  it("returns all pools successfully with default limit and offset", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("returns pools with custom limit and offset", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ limit: "5", offset: "2" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      5,
      2,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("uses default limit and offset when invalid values are passed", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ limit: "-5", offset: "-18" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("returns an error if fetching pools fails", async () => {
    MockedPoolsService.getAllPools.mockRejectedValue(
      new Error("Database error"),
    );

    const result: APIGatewayProxyResultV2 = await getAllPools(mockEvent());

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      18,
      0,
    );
    expect(result).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });

  it("returns pools based on status and applyPausedFallback", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ status: "ongoing", applyPausedFallback: "true" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "ongoing",
      "newest",
      true,
      18,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });

  it("caps limit at 50 when a higher value is provided", async () => {
    MockedPoolsService.getAllPools.mockResolvedValue(mockPoolsData);

    const result: APIGatewayProxyResultV2 = await getAllPools(
      mockEvent({ limit: "1000", offset: "0" }),
    );

    expect(MockedPoolsService.getAllPools).toHaveBeenCalledWith(
      "",
      "newest",
      false,
      50,
      0,
    );
    expect(result).toEqual(buildOkResponse(mockPoolsData));
  });
});
