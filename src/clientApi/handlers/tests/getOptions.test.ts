import { APIGatewayProxyEventV2 } from "aws-lambda";
import getOptionsHandler from "../getOptions";
import PoolsService from "../../../pools/service";
import PoolOptionsService from "../../../poolOptions/service";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";

const mockPoolAddress = "mockPoolAddress";
const mockEvent = {
  queryStringParameters: {
    pool: mockPoolAddress,
  },
} as unknown as APIGatewayProxyEventV2;

const mockPool = {
  address: mockPoolAddress,
  description: "",
  image: "",
  title: "",
  isPaused: false,
  value: "",
  createdAt: new Date(),
};

const mockOptions = [
  {
    address: "",
    pool: "",
    value: "",
    isWinningOption: false,
    title: "",
  },
  {
    address: "",
    pool: "",
    value: "",
    isWinningOption: false,
    title: "",
  },
];

const spiedGetPoolByAddress = jest
  .spyOn(PoolsService, "getPoolByAddress")
  .mockResolvedValue(mockPool);
const spiedGetAllInPool = jest
  .spyOn(PoolOptionsService, "getAllInPool")
  .mockResolvedValue(mockOptions);

describe("getOptionsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns bad request error if pool address is not provided", async () => {
    const mockEvent = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEventV2;
    const response = await getOptionsHandler(mockEvent);
    expect(response).toEqual(buildBadRequestError("Pool address is required"));
  });

  it("returns not found error if pool is not found", async () => {
    spiedGetPoolByAddress.mockResolvedValue(null);
    const response = await getOptionsHandler(mockEvent);

    expect(spiedGetPoolByAddress).toHaveBeenCalledWith(
      mockEvent.queryStringParameters?.pool,
    );
    expect(response).toEqual(
      buildNotFoundError(
        `Pool with address ${mockEvent.queryStringParameters?.pool} not found`,
      ),
    );
  });

  it("returns ok response if pool is found", async () => {
    spiedGetPoolByAddress.mockResolvedValue(mockPool);
    spiedGetAllInPool.mockResolvedValue(mockOptions);
    const response = await getOptionsHandler(mockEvent);

    expect(spiedGetAllInPool).toHaveBeenCalledWith(
      mockEvent.queryStringParameters?.pool,
    );
    expect(response).toEqual(buildOkResponse(mockOptions));
  });
});
