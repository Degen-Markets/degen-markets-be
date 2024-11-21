import { Action, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { SignMessageResponse } from "@solana/actions-spec";
import { messageString } from "../utils/cryptography";

const boxSignMessage = async () => {
  const response: SignMessageResponse = {
    type: "message",
    data: messageString,
    links: {
      next: {
        type: "post",
        href: "/mystery-box/open/verify-signature",
      },
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default boxSignMessage;
