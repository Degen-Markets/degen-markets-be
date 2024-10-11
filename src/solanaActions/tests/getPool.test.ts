import { getPool } from "../getPool";
import PoolsService from "../../pools/service";
import { PoolEntity } from "../../pools/types";
import PoolOptionsService from "../../poolOptions/service";
import { PoolOptionEntity } from "../../poolOptions/types";
import { APIGatewayProxyEventV2 } from "aws-lambda";

describe("getPool", () => {
  const dummyOptions: PoolOptionEntity[] = [
    {
      address: "option0",
      title: "option0",
      value: "400000000",
      pool: "pool",
      isWinningOption: false,
    },
    {
      address: "option1",
      title: "option1",
      value: "300000000",
      pool: "pool",
      isWinningOption: false,
    },
    {
      address: "option2",
      title: "option2",
      value: "300000000",
      pool: "pool",
      isWinningOption: false,
    },
    {
      address: "option3",
      title: "option3",
      value: "100000000",
      pool: "pool",
      isWinningOption: false,
    },
  ];

  // calculate the total value of the pool based on option values
  const totalPoolValue = dummyOptions
    .reduce((sum, option) => sum + parseInt(option.value), 0)
    .toString();

  const dummyPool: PoolEntity = {
    address: "pool",
    title: "dummy pool",
    value: totalPoolValue,
    description: "",
    image: "",
    isPaused: false,
    createdAt: new Date(),
  };

  it("successfully returns a pool with total stats amounting to 100% for three or fewer options", async () => {
    jest
      .spyOn(PoolsService, "getPoolByAddress")
      .mockResolvedValueOnce(dummyPool);
    jest
      .spyOn(PoolOptionsService, "getAllInPool")
      .mockResolvedValueOnce(dummyOptions.slice(0, 3));

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
    expect(sum).toEqual(100);
  });

  it("returns select input with all options when more than three options are present", async () => {
    jest
      .spyOn(PoolsService, "getPoolByAddress")
      .mockResolvedValueOnce(dummyPool);
    jest
      .spyOn(PoolOptionsService, "getAllInPool")
      .mockResolvedValueOnce(dummyOptions);

    const event = {
      pathParameters: {
        address: dummyPool.address,
      },
    } as unknown as APIGatewayProxyEventV2;

    const res = await getPool(event);
    const responseBody = JSON.parse(res.body);

    const selectAction = responseBody.links.actions.find(
      (action: { parameters: { type: string }[] }) =>
        action.parameters.some((param) => param.type === "select"),
    );

    const optionLabels = selectAction.parameters[0].options.map(
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

    expect(selectAction).toBeDefined();
    expect(selectAction.parameters[0].options.length).toBe(4);
    expect(sum).toEqual(100);
  });
});
