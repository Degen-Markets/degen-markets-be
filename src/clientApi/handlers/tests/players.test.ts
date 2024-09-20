import { APIGatewayProxyEventV2 } from "aws-lambda";
import PlayersService from "../../../players/service";
import { createOrderByClause, getPlayersHandler } from "../players";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import { PlayerEntity } from "../../../players/schema";

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

    const mockedPlayers: PlayerEntity[] = [
      {
        address: "1",
        points: 10,
        twitterUsername: null,
        twitterId: null,
        twitterPfpUrl: null,
      },
      {
        address: "2",
        points: 20,
        twitterUsername: null,
        twitterId: null,
        twitterPfpUrl: null,
      },
    ];
    const mockedGetPlayers = jest.fn().mockResolvedValue(mockedPlayers);
    jest
      .spyOn(PlayersService, "getPlayers")
      .mockImplementation(mockedGetPlayers);

    const response = await getPlayersHandler(mockEvent);

    expect(mockedGetPlayers).toHaveBeenCalledWith(
      5,
      0,
      createOrderByClause("ASC"),
    );
    expect(response).toEqual(buildOkResponse(mockedPlayers));
  });

  it("returns a Bad Request error for invalid sort field", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "5",
        offset: "0",
        sort: "invalidField:ASC",
      },
    } as any;

    const response = await getPlayersHandler(mockEvent);
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
    const error = new Error("Database error");
    jest.spyOn(PlayersService, "getPlayers").mockRejectedValue(error);
    const errorSpy = jest.fn();
    jest.spyOn(Logger.prototype, "error").mockImplementation(errorSpy);

    const response = await getPlayersHandler(mockEvent);

    expect(errorSpy).toHaveBeenCalledWith("Error fetching players", {
      error,
    });
    expect(response).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });

  it("returns players with a limit capped at 20 when limit exceeds 20", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        limit: "50",
        offset: "0",
        sort: "points:ASC",
      },
    } as any;

    const mockedPlayers: PlayerEntity[] = [
      {
        address: "1",
        points: 10,
        twitterUsername: null,
        twitterId: null,
        twitterPfpUrl: null,
      },
      {
        address: "2",
        points: 20,
        twitterUsername: null,
        twitterId: null,
        twitterPfpUrl: null,
      },
    ];
    const mockedGetPlayers = jest.fn().mockResolvedValue(mockedPlayers);
    jest
      .spyOn(PlayersService, "getPlayers")
      .mockImplementation(mockedGetPlayers);

    const response = await getPlayersHandler(mockEvent);

    expect(mockedGetPlayers).toHaveBeenCalledWith(
      20,
      0,
      createOrderByClause("ASC"),
    );
    expect(response).toEqual(buildOkResponse(mockedPlayers));
  });
});
