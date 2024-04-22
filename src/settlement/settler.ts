import {Logger} from '@aws-lambda-powertools/logger'
import {injectLambdaContext} from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import {SettlementService} from "./SettlementService";

const logger = new Logger({serviceName: 'settler'})
const settlementService = new SettlementService()

export const handleSettlement = async () => {
  await settlementService.handleSettlement()
}

export const handler = middy(handleSettlement)
  .use(injectLambdaContext(logger, {logEvent: true}))