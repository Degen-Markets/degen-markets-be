import * as anchor from "@coral-xyz/anchor";
import { getBytesFromHashedStr } from "../utils/cryptography";
import { programId } from "../utils/constants";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "PoolsUtils" });

export const derivePoolAccountKey = (
  title: string,
  creator: anchor.web3.PublicKey,
) => {
  logger.info(`Deriving pool account from ${title} & ${creator.toString()}`);
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(title), creator.toBytes()],
    programId,
  );
  logger.info(`Derived pool account key: ${pda.toString()}`);
  return pda;
};
