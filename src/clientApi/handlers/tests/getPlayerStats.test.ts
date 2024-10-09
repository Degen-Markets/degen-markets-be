import { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import getPlayerStatsHandler from "../getPlayerStats";
import PlayersService from "../../../players/service";
import { PlayerEntity } from "../../../players/schema";

const mockEvent = {
  pathParameters: {
    id: "mockId",
  },
} as unknown as APIGatewayProxyEventV2;

const mockPlayer: PlayerEntity = {
  address: "",
  points: 0,
  twitterUsername: "",
  twitterPfpUrl: "",
  twitterId: "",
};

const spiedGetPlayerByAddress = jest
  .spyOn(PlayersService, "getPlayerByAddress")
  .mockResolvedValue(mockPlayer);

const mockPlayerStats = {
  poolEntries: [
    {
      address: "",
      value: "",
      pool: {
        address: "",
        title: "",
        totalValue: "",
      },
      option: {
        address: "",
        title: "",
      },
    },
  ],
};
const spiedGetStats = jest
  .spyOn(PlayersService, "getStats")
  .mockResolvedValue(mockPlayerStats);

describe("getPlayerStatsHandler", () => {
  it("should return a bad request error if the player id is not provided", async () => {
    const response = await getPlayerStatsHandler({} as APIGatewayProxyEventV2);
    expect(response).toEqual(
      buildBadRequestError(":id URL path parameter is required"),
    );
  });

  it("should return a not found error if the player does not exist", async () => {
    spiedGetPlayerByAddress.mockResolvedValueOnce(null);
    const response = await getPlayerStatsHandler(mockEvent);

    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEvent.pathParameters?.id,
    );
    expect(response).toEqual(buildNotFoundError("Player not found"));
  });

  it("should return the player stats if the player exists", async () => {
    const response = await getPlayerStatsHandler(mockEvent);

    expect(spiedGetStats).toHaveBeenCalledWith(mockEvent.pathParameters?.id);
    expect(response).toEqual(buildOkResponse(mockPlayerStats));
  });
});
