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
        image: "",
      },
      option: {
        address: "",
        title: "",
        totalValue: "",
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

  it("should return a bad request error if the sort parameter is not valid", async () => {
    const mockEventWithInvalidField = {
      ...mockEvent,
      queryStringParameters: {
        sort: "invalid:ASC",
      },
    };
    const response1 = await getPlayerStatsHandler(mockEventWithInvalidField);

    if (typeof response1 !== "object") {
      expect(typeof response1).toBe("object");
      return;
    }
    expect(response1.statusCode).toEqual(400);
    const parsedBody1 = JSON.parse(response1.body || "{}");
    expect(parsedBody1.message).toEqual(
      expect.stringContaining("Sort field must be one of:"),
    );

    const mockEventWithInvalidDir = {
      ...mockEvent,
      queryStringParameters: {
        sort: "createdAt:INVALID",
      },
    };
    const response2 = await getPlayerStatsHandler(mockEventWithInvalidDir);

    if (typeof response2 !== "object") {
      expect(typeof response2).toBe("object");
      return;
    }
    expect(response2.statusCode).toEqual(400);
    const parsedBody2 = JSON.parse(response2.body || "{}");
    expect(parsedBody2.message).toEqual(
      expect.stringContaining("Sort direction must be either 'ASC' or 'DESC'"),
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
    // with no sort parameter
    const response = await getPlayerStatsHandler(mockEvent);

    expect(spiedGetStats).toHaveBeenCalledWith(mockEvent.pathParameters?.id, {
      sort: undefined,
    });
    expect(response).toEqual(buildOkResponse(mockPlayerStats));

    // with sort parameter
    const sortCombos = ["createdAt"]
      .map((field) => ["ASC", "DESC"].map((dir) => ({ field, direction: dir })))
      .flat();
    const promises = sortCombos.map(async (sort) => {
      const mockEventWithSort = {
        ...mockEvent,
        queryStringParameters: {
          sort: `${sort.field}:${sort.direction}`,
        },
      };
      const response2 = await getPlayerStatsHandler(mockEventWithSort);

      expect(spiedGetStats).toHaveBeenCalledWith(mockEvent.pathParameters?.id, {
        sort,
      });
      expect(response2).toEqual(buildOkResponse(mockPlayerStats));
    });
    await Promise.all(promises);
  });
});
