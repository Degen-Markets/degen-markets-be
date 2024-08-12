import getParamToListPlayersFromQs from "../getParamToListPlayersFromQs";
import { ESortDirections } from "../../../../utils/queryString";
import { playersTableColumnNames } from "../../../../players/schema";

describe("getParamToListPlayersFromQs", () => {
  const maxPlayersReturned = 10;
  const defaultOrderBy = { points: ESortDirections.DESC };
  const allowedSortCols = ["points"] as typeof playersTableColumnNames;

  it("should return correct parameters for valid query string", () => {
    const qs = {
      limit: "5",
      offset: "2",
      sort: "points:ASC",
    };

    const result = getParamToListPlayersFromQs(qs, {
      maxPlayersReturned,
      defaultOrderBy,
      allowedSortCols,
    });

    expect(result).toEqual({
      limit: 5,
      offset: 2,
      orderBy: { points: ESortDirections.ASC },
    });
  });

  it("should throw an error for invalid limit", () => {
    const qs = { limit: "invalid" };

    expect(() => {
      getParamToListPlayersFromQs(qs, {
        maxPlayersReturned,
        defaultOrderBy,
        allowedSortCols,
      });
    }).toThrow("Invalid limit parameter(invalid)");
  });

  it("should respect the maximum limit value", () => {
    const qs1 = { limit: "20" };
    const result1 = getParamToListPlayersFromQs(qs1, {
      maxPlayersReturned,
      defaultOrderBy,
      allowedSortCols,
    });
    expect(result1).toEqual({
      limit: maxPlayersReturned,
      orderBy: defaultOrderBy,
    });

    const qs2 = { limit: "2" };
    const result2 = getParamToListPlayersFromQs(qs2, {
      maxPlayersReturned,
      defaultOrderBy,
      allowedSortCols,
    });
    expect(result2).toEqual({ limit: 2, orderBy: defaultOrderBy });
  });

  it("should throw an error for invalid offset", () => {
    const qs = { offset: "invalid" };

    expect(() => {
      getParamToListPlayersFromQs(qs, {
        maxPlayersReturned,
        defaultOrderBy,
        allowedSortCols,
      });
    }).toThrow("Invalid offset parameter(invalid)");
  });

  it("should throw an error for invalid sort", () => {
    const qs = { sort: "invalidField:ASC" };

    expect(() => {
      getParamToListPlayersFromQs(qs, {
        maxPlayersReturned,
        defaultOrderBy,
        allowedSortCols,
      });
    }).toThrow("Invalid sort parameter(invalidField:ASC)");
  });

  it("should provide a default sort direction", () => {
    const qs = {
      sort: "points",
    };

    const result = getParamToListPlayersFromQs(qs, {
      maxPlayersReturned,
      defaultOrderBy,
      allowedSortCols,
    });

    expect(result).toEqual({
      limit: maxPlayersReturned,
      orderBy: { points: ESortDirections.DESC },
    });
  });

  it("should apply default values when parameters are missing", () => {
    const qs = {};

    const result = getParamToListPlayersFromQs(qs, {
      maxPlayersReturned,
      defaultOrderBy,
      allowedSortCols,
    });

    expect(result).toEqual({
      limit: maxPlayersReturned,
      orderBy: defaultOrderBy,
    });
  });
});
