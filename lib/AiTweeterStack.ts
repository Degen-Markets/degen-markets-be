import { TaggedStack } from "./TaggedStack";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration, StackProps } from "aws-cdk-lib";
import * as path from "path";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { DeploymentEnv } from "./utils";

interface AiStackProps extends StackProps {
  deploymentEnv: DeploymentEnv;
}

export class AiTweeterStack extends TaggedStack {
  constructor(scope: Construct, id: string, props: AiStackProps) {
    super(scope, id, props);
    const importerLambda = new NodejsFunction(this, "AiTweeter", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(1),
      description: "AI Tweeter lambda",
      environment: {
        OPENAI_API_KEY: getMandatoryEnvVariable("OPENAI_API_KEY"),
        TWITTER_BOT_APP_KEY: getMandatoryEnvVariable("TWITTER_BOT_APP_KEY"),
        TWITTER_BOT_APP_SECRET: getMandatoryEnvVariable(
          "TWITTER_BOT_APP_SECRET",
        ),
        TWITTER_BOT_ACCESS_TOKEN: getMandatoryEnvVariable(
          "TWITTER_BOT_ACCESS_TOKEN",
        ),
        TWITTER_BOT_ACCESS_TOKEN_SECRET: getMandatoryEnvVariable(
          "TWITTER_BOT_ACCESS_TOKEN_SECRET",
        ),
      },
      memorySize: 256,
      functionName: "AiTweeter",
      entry: path.join(__dirname, "../src/aiTweeter/aiTweeter.ts"),
      logRetention: RetentionDays.ONE_MONTH,
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk"],
        minify: true,
      },
    });

    const rule = new Rule(this, "AiTweeterScheduler", {
      description: "Ai Tweeter scheduler",
      schedule: Schedule.rate(
        props.deploymentEnv === DeploymentEnv.production
          ? Duration.minutes(15)
          : Duration.minutes(3),
      ),
      ruleName: "AiTweeterScheduler",
    });
    rule.addTarget(new LambdaFunction(importerLambda));
  }
}
