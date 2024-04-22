import {Logger} from '@aws-lambda-powertools/logger'
import {BetEntity} from './BetEntity'
import {DatabaseClient} from "../clients/DatabaseClient";

export class BetService {
  private readonly logger = new Logger({serviceName: 'BetService'})
  private readonly databaseClient = new DatabaseClient()

  findBets = async (): Promise<BetEntity[]> => {
    this.logger.info('fetching bets')
    const response = await this.databaseClient.executeStatement('select * from bets;')
    return response.rows as BetEntity[]
  }
}