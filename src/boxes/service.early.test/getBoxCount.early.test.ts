// Unit tests for: getBoxCount

import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DatabaseClient } from "../../clients/DatabaseClient";
import MysteryBoxServices from "../service";

jest.mock("../../clients/DatabaseClient");

describe("MysteryBoxServices.getBoxCount() getBoxCount method", () => {
  let mysteryBoxServices: MysteryBoxServices;
  let mockDbClient: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    mockDbClient = new DatabaseClient() as jest.Mocked<DatabaseClient>;
    mysteryBoxServices = new MysteryBoxServices();
    (mysteryBoxServices as any).databaseClient = mockDbClient;
  });

  describe("Happy paths", () => {
    it("should return correct counts when there are multiple boxes", async () => {
      // Arrange: Mock the database response
      const mockResult = [{ totalBoxes: 5, openedBoxes: 2, unopenedBoxes: 3 }];
      mockDbClient.withDb.mockImplementation(async (callback) => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockResult),
            }),
          }),
        } as unknown as NodePgDatabase);
      });

      // Act: Call the method
      const result = await mysteryBoxServices.getBoxCount("player1");

      // Assert: Verify the result
      expect(result).toEqual({
        totalBoxes: 5,
        openedBoxes: 2,
        unopenedBoxes: 3,
      });
    });

    it("should return zero counts when there are no boxes", async () => {
      // Arrange: Mock the database response
      const mockResult = [{ totalBoxes: 0, openedBoxes: 0, unopenedBoxes: 0 }];
      mockDbClient.withDb.mockImplementation(async (callback) => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockResult),
            }),
          }),
        } as unknown as NodePgDatabase);
      });

      // Act: Call the method
      const result = await mysteryBoxServices.getBoxCount("player2");

      // Assert: Verify the result
      expect(result).toEqual({
        totalBoxes: 0,
        openedBoxes: 0,
        unopenedBoxes: 0,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle the case where all boxes are opened", async () => {
      // Arrange: Mock the database response
      const mockResult = [{ totalBoxes: 3, openedBoxes: 3, unopenedBoxes: 0 }];
      mockDbClient.withDb.mockImplementation(async (callback) => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockResult),
            }),
          }),
        } as unknown as NodePgDatabase);
      });

      // Act: Call the method
      const result = await mysteryBoxServices.getBoxCount("player3");

      // Assert: Verify the result
      expect(result).toEqual({
        totalBoxes: 3,
        openedBoxes: 3,
        unopenedBoxes: 0,
      });
    });

    it("should handle the case where all boxes are unopened", async () => {
      // Arrange: Mock the database response
      const mockResult = [{ totalBoxes: 4, openedBoxes: 0, unopenedBoxes: 4 }];
      mockDbClient.withDb.mockImplementation(async (callback) => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockResult),
            }),
          }),
        } as unknown as NodePgDatabase);
      });

      // Act: Call the method
      const result = await mysteryBoxServices.getBoxCount("player4");

      // Assert: Verify the result
      expect(result).toEqual({
        totalBoxes: 4,
        openedBoxes: 0,
        unopenedBoxes: 4,
      });
    });

    it("should handle the case where the player does not exist", async () => {
      // Arrange: Mock the database response
      const mockResult = [{ totalBoxes: 0, openedBoxes: 0, unopenedBoxes: 0 }];
      mockDbClient.withDb.mockImplementation(async (callback) => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockResult),
            }),
          }),
        } as unknown as NodePgDatabase);
      });

      // Act: Call the method
      const result = await mysteryBoxServices.getBoxCount("nonexistentPlayer");

      // Assert: Verify the result
      expect(result).toEqual({
        totalBoxes: 0,
        openedBoxes: 0,
        unopenedBoxes: 0,
      });
    });
  });
});

// End of unit tests for: getBoxCount
