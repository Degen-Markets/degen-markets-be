import { connection, program } from "../solanaActions/constants";
import { deriveEntryAccountKey } from "../solanaActions/enterPoolTx";
import { PublicKey } from "@solana/web3.js";
import { buildHttpResponse, buildOkResponse } from "../utils/httpResponses";

const getEntryAccount = async (
  optionAccountKeyString: string,
  entrantAccountKeyString: string,
) => {
  const optionAccountKey = new PublicKey(optionAccountKeyString);
  const entrantAccountKey = new PublicKey(entrantAccountKeyString);
  const entryAccountKey = deriveEntryAccountKey(
    optionAccountKey,
    entrantAccountKey,
  );
  try {
    const entryAccount = await program.account.entry.fetch(entryAccountKey);

    return buildOkResponse({
      ...entryAccount,
      value: Number(entryAccount.value),
      id: entryAccountKey.toString(),
    });
  } catch (error) {
    return buildHttpResponse({ status: 204, body: {} });
  }
};

export default getEntryAccount;
