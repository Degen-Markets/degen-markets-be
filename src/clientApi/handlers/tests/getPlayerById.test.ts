import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPlayerByIdHandler } from "../players";
import PlayersService from "../../../players/service";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";

const id = "14RTAiwGjWYsMUZqmFvpsyvKEiW22FmbJrvBqmF98i7y";

describe("getPlayerByIdHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns player data with valid ID", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: id,
      },
    } as any;

    const mockPlayer = {
      address: id,
      points: 100,
      twitterUsername: "player",
      twitterPfpUrl: "http://example.com/pfp.jpg",
      twitterId: "1",
    };
    const mockedGetPlayerByAddress = jest.fn().mockResolvedValue(mockPlayer);
    jest
      .spyOn(PlayersService, "getPlayerByAddress")
      .mockImplementation(mockedGetPlayerByAddress);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(mockedGetPlayerByAddress).toHaveBeenCalledWith(id);
    expect(response).toEqual(buildOkResponse(mockPlayer));
  });

  it("returns a Bad Request error for missing id parameter", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {},
    } as any;

    const response = await getPlayerByIdHandler(mockEvent);
    expect(response).toEqual(buildBadRequestError("Player ID is required"));
  });

  it("returns a 404 error when player not found", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: "player1",
      },
    } as any;

    const mockGetPlayerByAddress = jest.fn().mockResolvedValue(null);
    jest
      .spyOn(PlayersService, "getPlayerByAddress")
      .mockImplementation(mockGetPlayerByAddress);
    const response = await getPlayerByIdHandler(mockEvent);

    expect(mockGetPlayerByAddress).toHaveBeenCalledWith("player1");
    expect(response).toEqual(buildNotFoundError("Player not found"));
  });

  it("logs and returns error on database access failure", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: id,
      },
    } as any;
    const error = new Error("Database error");
    jest.spyOn(PlayersService, "getPlayerByAddress").mockRejectedValue(error);
    const errorSpy = jest.fn();
    jest.spyOn(Logger.prototype, "error").mockImplementation(errorSpy);

    const response = await getPlayerByIdHandler(mockEvent);
    expect(errorSpy).toHaveBeenCalledWith("Error fetching player", {
      error,
    });
    expect(response).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });
});
