import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { LinkedAction, ActionPostResponse } from "@solana/actions-spec";
import { connection, program } from "../clients/SolanaProgramClient";
import { deriveOptionAccountKey } from "../poolOptions/utils";
import { getOptionTitleHash } from "./cryptography";
import { createPostResponse } from "@solana/actions";

export const _Utils = {
  async serializeCreateOptionTx({
    title,
    poolAccountKey,
    account,
    count,
    imageUrl,
    poolTitle,
    existingOptionsString,
  }: {
    title: string;
    poolAccountKey: PublicKey;
    account: string;
    count: number;
    imageUrl: string;
    poolTitle: string;
    existingOptionsString: string;
  }): Promise<ActionPostResponse> {
    const optionAccountKey = await deriveOptionAccountKey(
      title,
      poolAccountKey,
    );
    const transaction = await program.methods
      .createOption(
        title,
        getOptionTitleHash(poolAccountKey, title) as unknown as number[],
      )
      .accountsPartial({
        optionAccount: optionAccountKey,
        poolAccount: poolAccountKey,
        admin: account,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([])
      .transaction();

    const creator = new PublicKey(account);
    const block = await connection.getLatestBlockhash();
    transaction.feePayer = creator;
    transaction.recentBlockhash = block.blockhash;

    const finishPoolCreationAction: LinkedAction[] =
      count > 2
        ? [
            {
              type: "post",
              href: `/pools/finish?pool=${poolAccountKey}&image=${imageUrl}`,
              label: "Finish",
            },
          ]
        : [];

    const baseDescription = `Create option #${count} for your bet below. Current options are: ${existingOptionsString}.`;
    const description =
      count > 2
        ? `${baseDescription} Click on "Finish" if you don't wish to create any more options. After clicking on "Finish", your bet will appear on @DegenMarketsBot`
        : baseDescription;

    return createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        links: {
          next: {
            type: "inline",
            action: {
              type: "action",
              label: "",
              icon: imageUrl,
              title: poolTitle,
              description,
              links: {
                actions: [
                  {
                    type: "transaction",
                    label: "Create another option for your bet",
                    href: `/pools/${poolAccountKey}/create-option?count=${count + 1}&image=${imageUrl}&poolTitle=${poolTitle}&options=${existingOptionsString}, {optionTitle}`,
                    parameters: [
                      {
                        name: "optionTitle",
                        label: "Option text",
                        type: "text",
                      },
                    ],
                  },
                  ...finishPoolCreationAction,
                ],
              },
            },
          },
        },
      },
    });
  },
};
