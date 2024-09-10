import { APIGatewayProxyEventV2 } from "aws-lambda";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import { createOrderByClause, getPlayersHandler } from "../players";
import { Logger } from "@aws-lambda-powertools/logger";
import { buildBadRequestError, ErrorProps } from "../../../utils/errors";
import {
  buildErrorResponse,
  buildOkResponse,
} from "../../../utils/httpResponses";

jest.mock("../../../players/service");
jest.mock("../../../clients/DrizzleClient");
jest.mock("@aws-lambda-powertools/logger");

const mockGetPlayers = jest.mocked(PlayersService.getPlayers);
const mockDrizzleClient = jest.mocked(DrizzleClient.makeDb);
const logger = jest.mocked(Logger).mock.instances[0] as jest.Mocked<Logger>;

describe("getPlayersHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns players with valid parameters", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "5",
        offset: "0",
        sort: "points:ASC",
      },
    } as any;

    const mockPlayers = [
      { id: 1, points: 10 },
      { id: 2, points: 20 },
    ];
    mockDrizzleClient.mockResolvedValue({} as any);
    jest
      .mocked(PlayersService.getPlayers)
      .mockResolvedValue(mockPlayers as any);

    const response = await getPlayersHandler(mockEvent);

    expect(mockDrizzleClient).toHaveBeenCalled();
    expect(mockGetPlayers).toHaveBeenCalledWith(
      expect.anything(),
      5,
      0,
      createOrderByClause("ASC"),
    );
    expect(response).toEqual(buildOkResponse(mockPlayers));
  });

  it("returns a Bad Request error for invalid sort field", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "5",
        offset: "0",
        sort: "invalidField:ASC",
      },
    } as any;

    const response = (await getPlayersHandler(mockEvent)) as ErrorProps;
    expect(response).toEqual(
      buildBadRequestError("Invalid field: invalidField"),
    );
  });

  it("returns a Bad Request error for invalid sort direction", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "5",
        offset: "0",
        sort: "points:INVALID",
      },
    } as any;

    const response = await getPlayersHandler(mockEvent);
    expect(response).toEqual(
      buildBadRequestError("Invalid direction: INVALID"),
    );
  });

  it("logs and returns error on database access failure", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "5",
        offset: "0",
        sort: "points:ASC",
      },
    } as any;

    mockDrizzleClient.mockRejectedValue(new Error("Database error"));

    const response = (await getPlayersHandler(mockEvent)) as ErrorProps;

    expect(logger.error).toHaveBeenCalledWith("Error fetching players", {
      errorMessage: "Database error",
    });
    expect(response).toEqual(
      buildErrorResponse("An unexpected error occurred"),
    );
  });
});
