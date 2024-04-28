import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { SecretClient } from "./SecretClient";
import { mockClient } from "aws-sdk-client-mock";

describe("SecretClient", () => {
  const secretClient = new SecretClient();

  afterEach(() => jest.resetAllMocks());

  it("should load plaintext secret", async () => {
    const secretsManagerMock = mockClient(SecretsManagerClient);
    secretsManagerMock.on(GetSecretValueCommand).resolvesOnce({
      SecretString: "my-string",
    });

    const response =
      await secretClient.loadPlainTextSecretValue("my-secret-name");

    expect(response).toBe("my-string");
  });

  it("should load json secret", async () => {
    const secretsManagerMock = mockClient(SecretsManagerClient);
    secretsManagerMock.on(GetSecretValueCommand).resolvesOnce({
      SecretString: '{"value": "myValue"}',
    });

    const response = await secretClient.loadJsonSecretValue<{ value: string }>(
      "my-secret-name",
    );

    expect(response.value).toBe("myValue");
  });
});
