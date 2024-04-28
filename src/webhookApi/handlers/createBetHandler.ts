import { APIGatewayEvent } from "aws-lambda";
import { CreateBetEvent } from "../types/CreateBetEvent";

const createBetHandler = (event: APIGatewayEvent) => {
  console.log(`received create bet event: ${event.body}`);
  const createBetEvent = JSON.parse(event.body || "{}") as CreateBetEvent;
  createBetEvent.event.data.block.logs.forEach((log) => {});
  return 200;
};

export default createBetHandler;
