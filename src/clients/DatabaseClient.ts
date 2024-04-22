import {Logger} from '@aws-lambda-powertools/logger'
import {Client, ClientConfig} from 'pg'
import {getMandatoryEnvVariable} from '../utils/getMandatoryEnvValue'
import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager'
import * as fs from 'fs'

export class DatabaseClient {
  private readonly logger = new Logger({serviceName: 'DatabaseClient'})
  private secretName = getMandatoryEnvVariable('DATABASE_PASSWORD_SECRET')
  private user = getMandatoryEnvVariable('DATABASE_USERNAME')
  private database = getMandatoryEnvVariable('DATABASE_DATABASE_NAME')
  private host = getMandatoryEnvVariable('DATABASE_HOST')
  private port = Number(getMandatoryEnvVariable('DATABASE_PORT'))
  private password: string | undefined = undefined

  executeStatement = async (statement: string) => {
    const connection = await this.createConnection()
    const result = await connection.query(statement)
    await connection.end()
    return result
  }

  private getPassword = async (): Promise<string> => {
    try {
      if (this.password) {
        return this.password
      }
      const secretsManager = new SecretsManagerClient({region: 'eu-west-1'})
      const getSecretValueCommand = new GetSecretValueCommand({
        SecretId: this.secretName,
      })
      const secretValue = await secretsManager.send(getSecretValueCommand)
      const secretData = JSON.parse(secretValue.SecretString!)
      return secretData.password
    } catch (e) {
      this.logger.error('failed to fetch database password', {error: e})
      throw e
    }
  }

  private createConnection = async () => {
    const config: ClientConfig = {
      user: this.user,
      host: this.host,
      database: this.database,
      password: await this.getPassword(),
      port: this.port,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('resources/db/eu-west-1-bundle.pem', 'utf8'),
      },
    }
    this.logger.info('connecting to database', {...config, password: '***'})
    const client = new Client(config)
    await client.connect()
    return client
  }
}