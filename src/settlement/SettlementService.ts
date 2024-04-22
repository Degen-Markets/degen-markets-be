import {Logger} from "@aws-lambda-powertools/logger";

export class SettlementService {
  private readonly logger = new Logger({serviceName: 'SettlementService'})

  handleSettlement = async () => {
    this.logger.info('handle settlement')
    // TODO implement settlement logic
    // will be triggered periodically
  }
}