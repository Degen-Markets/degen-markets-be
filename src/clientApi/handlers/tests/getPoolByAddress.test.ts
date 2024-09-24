import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import PoolsService from "../../../pools/service";
import { getPoolByAddress } from "../pools";

jest.mock("../../../pools/service");

const MockedPoolsService = jest.mocked(PoolsService);
const address = "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y";

describe("getPoolByAddress", () => {
  const mockEvent = {
    pathParameters: { address: address },
  } as any;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the pool successfully", async () => {
    const mockPool = {
      address: address,
      title: "Pool 1",
      description: "Description for Pool 1",
      image: "https://example.com/pool1.jpg",
      isPaused: false,
      value: "1000",
      createdAt: new Date("2023-01-01"),
      options: [
        {
          address: "option1-address",
          title: "Option 1",
          value: "500",
          pool: address,
          isWinningOption: false,
        },
        {
          address: "option2-address",
          title: "Option 2",
          value: "500",
          pool: address,
          isWinningOption: true,
        },
      ],
    };

    MockedPoolsService.getPoolByAddress.mockResolvedValue(mockPool);

    const result: APIGatewayProxyResultV2 = await getPoolByAddress(mockEvent);

    expect(MockedPoolsService.getPoolByAddress).toHaveBeenCalledWith(address);
    expect(result).toEqual(buildOkResponse(mockPool));
  });

  it("returns a 404 if the pool is not found", async () => {
    MockedPoolsService.getPoolByAddress.mockResolvedValue(null as any);

    const result: APIGatewayProxyResultV2 = await getPoolByAddress(mockEvent);

    expect(MockedPoolsService.getPoolByAddress).toHaveBeenCalledWith(address);
    expect(result).toEqual(buildNotFoundError("Pool not found"));
  });

  it("returns error on database access failure", async () => {
    MockedPoolsService.getPoolByAddress.mockRejectedValue(
      new Error("Database error"),
    );

    const result: APIGatewayProxyResultV2 = await getPoolByAddress(mockEvent);

    expect(MockedPoolsService.getPoolByAddress).toHaveBeenCalledWith(address);
    expect(result).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });
});
