import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPlayerByIdHandler } from "../players";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";

jest.mock("../../../players/service");
jest.mock("../../../clients/DrizzleClient");
jest.mock("@aws-lambda-powertools/logger");

const mockGetPlayerByAddress = jest.mocked(PlayersService.getPlayerByAddress);
const mockDrizzleClient = jest.mocked(DrizzleClient.makeDb);
const logger = jest.mocked(Logger).mock.instances[0] as jest.Mocked<Logger>;
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

    mockDrizzleClient.mockResolvedValue({} as any);
    mockGetPlayerByAddress.mockResolvedValue(mockPlayer);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(mockDrizzleClient).toHaveBeenCalled();
    expect(mockGetPlayerByAddress).toHaveBeenCalledWith(expect.anything(), id);
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

    mockDrizzleClient.mockResolvedValue({} as any);
    mockGetPlayerByAddress.mockResolvedValue(null as any);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(mockDrizzleClient).toHaveBeenCalled();
    expect(mockGetPlayerByAddress).toHaveBeenCalledWith(
      expect.anything(),
      "player1",
    );
    expect(response).toEqual(buildNotFoundError("Player not found"));
  });

  it("logs and returns error on database access failure", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: id,
      },
    } as any;

    mockDrizzleClient.mockRejectedValue(new Error("Database error"));

    const response = await getPlayerByIdHandler(mockEvent);

    expect(logger.error).toHaveBeenCalledWith("Error fetching player", {
      error: new Error("Database error"),
    });
    expect(response).toEqual(
      buildInternalServerError("An unexpected error occurred"),
    );
  });
});
