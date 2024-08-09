import playersHandler from "../getPlayersHandler";
import { createApiGwEvent } from "./utils/createEvent";
import * as PlayerService from "../../../players/PlayerService";
import { ESortDirections } from "../../../utils/queryString";
import { playersTableColumnNames } from "../../../players/schema";

describe("getPlayersHandler", () => {
  const spiedFindAllPlayers = jest.spyOn(PlayerService, "findAllPlayers");
  spiedFindAllPlayers.mockImplementation(async () => undefined as any);

  it("has default limit", async () => {
    await playersHandler(createApiGwEvent({ queryStringParameters: {} }));
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 10 });
  });

  it("bounds the limit to 10", async () => {
    // less than 10
    await playersHandler(
      createApiGwEvent({ queryStringParameters: { limit: "3" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 3 });
    await playersHandler(
      createApiGwEvent({ queryStringParameters: { limit: "7" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 7 });

    // more than 10
    await playersHandler(
      createApiGwEvent({ queryStringParameters: { limit: "13" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 10 });
    await playersHandler(
      createApiGwEvent({ queryStringParameters: { limit: "57" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 10 });
  });

  it("has offset parameter", async () => {
    await playersHandler(
      createApiGwEvent({ queryStringParameters: { offset: "12" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 10, offset: 12 });

    await playersHandler(
      createApiGwEvent({ queryStringParameters: { offset: "92" } }),
    );
    expect(spiedFindAllPlayers).toHaveBeenCalledWith({ limit: 10, offset: 92 });
  });

  it("has sort parameter", async () => {
    for (const colName of playersTableColumnNames) {
      for (const sortDir of [ESortDirections.ASC, ESortDirections.DESC]) {
        await playersHandler(
          createApiGwEvent({
            queryStringParameters: { sort: `${colName}:${sortDir}` },
          }),
        );

        expect(spiedFindAllPlayers).toHaveBeenCalledWith({
          limit: 10,
          orderBy: { [colName]: sortDir },
        });
      }
    }
  });
});
