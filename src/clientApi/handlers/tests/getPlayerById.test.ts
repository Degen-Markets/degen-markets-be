import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPlayerByIdHandler } from "../players";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import { buildBadRequestError, ErrorProps } from "../../../utils/errors";
import {
  buildErrorResponse,
  buildOkResponse,
} from "../../../utils/httpResponses";

jest.mock("../../../players/service");
jest.mock("../../../clients/DrizzleClient");
jest.mock("@aws-lambda-powertools/logger");

const mockGetPlayerById = jest.mocked(PlayersService.getPlayerById);
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
    mockGetPlayerById.mockResolvedValue(mockPlayer);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(mockDrizzleClient).toHaveBeenCalled();
    expect(mockGetPlayerById).toHaveBeenCalledWith(expect.anything(), id);
    expect(response).toEqual(buildOkResponse(mockPlayer));
  });

  it("returns a Bad Request error for missing id parameter", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {},
    } as any;

    const response = (await getPlayerByIdHandler(mockEvent)) as ErrorProps;
    expect(response).toEqual(buildErrorResponse("Player ID is required", 400));
  });

  it("returns a 404 error when player not found", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: "player1",
      },
    } as any;

    mockDrizzleClient.mockResolvedValue({} as any);
    mockGetPlayerById.mockResolvedValue(null as any);

    const response = (await getPlayerByIdHandler(mockEvent)) as ErrorProps;

    expect(mockDrizzleClient).toHaveBeenCalled();
    expect(mockGetPlayerById).toHaveBeenCalledWith(
      expect.anything(),
      "player1",
    );
    expect(response).toEqual(buildErrorResponse("Player not found", 404));
  });

  it("logs and returns error on database access failure", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {
        id: id,
      },
    } as any;

    mockDrizzleClient.mockRejectedValue(new Error("Database error"));

    const response = (await getPlayerByIdHandler(mockEvent)) as ErrorProps;

    expect(logger.error).toHaveBeenCalledWith("Error fetching player", {
      error: new Error("Database error"),
    });
    expect(response).toEqual(
      buildErrorResponse("An unexpected error occurred"),
    );
  });
});
