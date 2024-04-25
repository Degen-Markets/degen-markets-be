import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager'
import {requireNotNull} from '../../lib/utils'

export class SecretClient {
  private readonly secretsManager = new SecretsManagerClient()

  loadPlainTextSecretValue = async (secretName: string): Promise<string> => {
    return await this.loadSecretValue(secretName)
  }

  loadJsonSecretValue = async <T>(secretName: string): Promise<T> => {
    const secretValue = await this.loadSecretValue(secretName)
    const secretData = JSON.parse(secretValue)
    return secretData as T
  }

  private loadSecretValue = async (secretName: string): Promise<string> => {
    const getSecretValueCommand = new GetSecretValueCommand({
      SecretId: secretName,
    })
    const response = await this.secretsManager.send(getSecretValueCommand)
    return requireNotNull(response.SecretString!, `Secret ${secretName} is empty`)
  }
}