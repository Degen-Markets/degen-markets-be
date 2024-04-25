import {Logger} from '@aws-lambda-powertools/logger'
import {SecretClient} from '../clients/SecretClient'
import {getMandatoryEnvVariable} from '../utils/getMandatoryEnvValue'

export class SettlementService {
  private readonly logger = new Logger({serviceName: 'SettlementService'})
  private secretName = getMandatoryEnvVariable('PRIVATE_KEY_SECRET')
  private secretClient = new SecretClient()

  handleSettlement = async () => {
    const privateKey = await this.secretClient.loadPlainTextSecretValue(this.secretName)

    this.logger.info('handle settlement', {privateKeyLength: privateKey.length})
    // TODO implement settlement logic
    // will be triggered periodically
  }
}