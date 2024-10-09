import { getPool } from "../getPool";
import PoolsService from "../../pools/service";
import { PoolEntity } from "../../pools/types";
import PoolOptionsService from "../../poolOptions/service";
import { PoolOptionEntity } from "../../poolOptions/types";
import { APIGatewayProxyEventV2 } from "aws-lambda";

describe("getPool", () => {
  it("successfully returns a pool with total stats amounting to 100%", async () => {
    const dummyPool: PoolEntity = {
      address: "pool",
      title: "dummy pool",
      value: "2081000000",
      description: "",
      image: "",
      isPaused: false,
      createdAt: new Date(),
    };
    const dummyOption: PoolOptionEntity = {
      address: "option0",
      title: "option0",
      value: "681000000",
      pool: dummyPool.address,
      isWinningOption: false,
    };
    const dummyOption1: PoolOptionEntity = {
      address: "option1",
      title: "option1",
      value: "470000000",
      pool: dummyPool.address,
      isWinningOption: false,
    };
    const dummyOption2: PoolOptionEntity = {
      address: "option2",
      title: "option2",
      value: "930000000",
      pool: dummyPool.address,
      isWinningOption: false,
    };

    jest
      .spyOn(PoolsService, "getPoolByAddress")
      .mockResolvedValueOnce(dummyPool);
    jest
      .spyOn(PoolOptionsService, "getAllInPool")
      .mockResolvedValueOnce([dummyOption, dummyOption1, dummyOption2]);

    const event = {
      pathParameters: {
        address: dummyPool.address,
      },
    } as unknown as APIGatewayProxyEventV2;

    const res = await getPool(event);
    const responseBody = JSON.parse(res.body);
    const optionLabels = responseBody.links.actions.map(
      (option: { label: string }) => option.label,
    );
    const percentages = optionLabels.map((label: string) => {
      const match = label.match(/\((\d+)%\)/);
      if (!match) {
        throw new Error(`Option ${label} does not have label!`);
      }
      return parseInt(match[1] || "0", 10);
    });
    const sum = percentages.reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    );
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });
});
