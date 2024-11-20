import getMysteryBoxes from "../getMysteryBoxes";

describe("getMysteryBoxes", () => {
  it("should return the initial action", async () => {
    const res = await getMysteryBoxes();
    // @ts-ignore-next-line
    const body = JSON.parse(res.body);
    expect(body.icon).toEqual(
      "https://degen-markets-static.s3.eu-west-1.amazonaws.com/degen-markets-banner.jpeg",
    );
    expect(body.links.actions).toEqual([
      {
        label: "Buy Boxes",
        type: "transaction",
        href: "/pools/mystery-boxes?count={count}",
        parameters: [
          {
            name: "count",
            type: "number",
            label: "Number of Mystery Boxes to buy",
            required: true,
            pattern: "[0-9]",
          },
        ],
      },
    ]);
  });
});
