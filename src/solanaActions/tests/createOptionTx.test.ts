import { APIGatewayProxyEventV2 } from "aws-lambda";
import { _Utils } from "../../utils/createOptionTx.utils";
import generateCreateOptionTx from "../createOptionTx";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "../constants";
import { PublicKey } from "@solana/web3.js";

jest.mock("../../utils/createOptionTx.utils");
jest.mock("@aws-lambda-powertools/logger");

describe("generateCreateOptionTx", () => {
  const mockPoolAddress = new PublicKey("11111111111111111111111111111111");
  const mockPoolTitle = "Test Pool";
  const mockCount = 2;
  const mockImageUrl = "https://example.com/image.jpg";
  const mockExistingOptions = "Option 1, Option 2";
  const mockAccount = "mockAccount";

  const mockEvent = {
    pathParameters: {
      poolAddress: mockPoolAddress,
    },
    queryStringParameters: {
      poolTitle: mockPoolTitle,
      count: mockCount.toString(),
      image: mockImageUrl,
      options: mockExistingOptions,
    },
    body: JSON.stringify({ account: mockAccount }),
  } as unknown as APIGatewayProxyEventV2;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if poolTitle is missing", async () => {
    const eventWithoutPoolTitle = {
      ...mockEvent,
      queryStringParameters: {
        ...mockEvent.queryStringParameters,
        poolTitle: undefined,
      },
    };

    const response = await generateCreateOptionTx(eventWithoutPoolTitle);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("returns 400 if existingOptionsString is missing", async () => {
    const eventWithoutOptions = {
      ...mockEvent,
      queryStringParameters: {
        ...mockEvent.queryStringParameters,
        options: undefined,
      },
    };

    const response = await generateCreateOptionTx(eventWithoutOptions);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("returns 400 if account is missing", async () => {
    const eventWithoutAccount = {
      ...mockEvent,
      body: JSON.stringify({}),
    };

    const response = await generateCreateOptionTx(eventWithoutAccount);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request!" }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("uses default banner if imageUrl is not provided", async () => {
    const eventWithoutImage = {
      ...mockEvent,
      queryStringParameters: {
        ...mockEvent.queryStringParameters,
        image: undefined,
      },
    };

    const mockPayload = {
      transaction: "mockTransaction",
      message: "Success",
      type: "transaction" as const,
    };
    jest
      .mocked(_Utils.serializeCreateOptionTx)
      .mockResolvedValueOnce(mockPayload);

    await generateCreateOptionTx(eventWithoutImage);

    expect(_Utils.serializeCreateOptionTx).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: defaultBanner,
      }),
    );
  });

  it("successfully creates an option transaction", async () => {
    const mockPayload = {
      transaction: "mockTransaction",
      message: "Success",
      type: "transaction" as const,
    };
    jest
      .mocked(_Utils.serializeCreateOptionTx)
      .mockResolvedValueOnce(mockPayload);

    const response = await generateCreateOptionTx(mockEvent);

    expect(_Utils.serializeCreateOptionTx).toHaveBeenCalledWith({
      title: "Option 2",
      poolAccountKey: expect.any(PublicKey),
      account: mockAccount,
      count: mockCount,
      imageUrl: mockImageUrl,
      poolTitle: mockPoolTitle,
      existingOptionsString: mockExistingOptions,
    });

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockPayload),
      headers: ACTIONS_CORS_HEADERS,
    });
  });

  it("handles errors from serializeCreateOptionTx", async () => {
    const mockError = new Error("Serialization failed");
    jest
      .mocked(_Utils.serializeCreateOptionTx)
      .mockRejectedValueOnce(mockError);

    const response = await generateCreateOptionTx(mockEvent);

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Something went wrong, please try again",
      }),
      headers: ACTIONS_CORS_HEADERS,
    });
  });
});
