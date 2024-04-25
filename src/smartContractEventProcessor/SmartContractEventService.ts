import {Logger} from '@aws-lambda-powertools/logger'

export class SmartContractEventService {
  private readonly logger = new Logger({serviceName: 'SmartContractEventService'})

  handleSmartContractEvent = async (event: any) => {
    // TODO handle smart contract event
    this.logger.info('handle smart contract event', {event})
  }
}