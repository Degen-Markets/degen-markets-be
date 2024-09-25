/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `solana/idl/degen_pools.json`.
 */
export type DegenPools = {
  address: "2JWqYTXG5yHSU78hjKb39YFx82whbK74v6sMqMG3TVBQ";
  metadata: {
    name: "degenPools";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "claimWin";
      discriminator: [163, 215, 101, 246, 25, 134, 110, 194];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
        },
        {
          name: "winner";
          writable: true;
          signer: true;
        },
        {
          name: "entryAccount";
          writable: true;
        },
        {
          name: "optionAccount";
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "createOption";
      discriminator: [226, 92, 124, 94, 113, 96, 60, 172];
      accounts: [
        {
          name: "optionAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "optionHash";
              },
            ];
          };
        },
        {
          name: "poolAccount";
          writable: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "optionTitle";
          type: "string";
        },
        {
          name: "optionHash";
          type: {
            array: ["u8", 32];
          };
        },
      ];
    },
    {
      name: "createPool";
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "titleHash";
              },
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "title";
          type: "string";
        },
        {
          name: "titleHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "imageUrl";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
      ];
    },
    {
      name: "enterPool";
      discriminator: [73, 134, 141, 203, 63, 251, 217, 169];
      accounts: [
        {
          name: "entryAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "optionAccount";
              },
              {
                kind: "account";
                path: "entrant";
              },
            ];
          };
        },
        {
          name: "optionAccount";
          writable: true;
        },
        {
          name: "poolAccount";
          writable: true;
        },
        {
          name: "entrant";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "value";
          type: "u64";
        },
      ];
    },
    {
      name: "setIsPaused";
      discriminator: [105, 103, 58, 197, 208, 86, 131, 112];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
      ];
      args: [
        {
          name: "isPaused";
          type: "bool";
        },
      ];
    },
    {
      name: "setWinningOption";
      discriminator: [156, 73, 113, 33, 170, 115, 163, 206];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
      ];
      args: [
        {
          name: "winningOption";
          type: "pubkey";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "entry";
      discriminator: [63, 18, 152, 113, 215, 246, 221, 250];
    },
    {
      name: "pool";
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    },
    {
      name: "poolOption";
      discriminator: [42, 22, 142, 109, 158, 112, 199, 199];
    },
  ];
  events: [
    {
      name: "optionCreated";
      discriminator: [22, 155, 156, 185, 146, 155, 71, 83];
    },
    {
      name: "poolCreated";
      discriminator: [202, 44, 41, 88, 104, 220, 157, 82];
    },
    {
      name: "poolEntered";
      discriminator: [224, 196, 156, 64, 200, 219, 71, 199];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "titleDoesNotMatchHash";
      msg: "Title hash does not match title!";
    },
    {
      code: 6001;
      name: "poolOptionDoesNotMatchHash";
      msg: "Pool option does not match hash!";
    },
    {
      code: 6002;
      name: "poolStateIncompatible";
      msg: "Pool is in an incompatible state!";
    },
    {
      code: 6003;
      name: "entryAlreadyClaimed";
      msg: "Entry already claimed!";
    },
    {
      code: 6004;
      name: "losingOption";
      msg: "Entry did not win";
    },
    {
      code: 6005;
      name: "entryNotDerivedFromOptionOrSigner";
      msg: "This entry was not derived from the winning option or the signer";
    },
    {
      code: 6006;
      name: "imageUrlTooLong";
      msg: "The image URL is too long. Maximum length is 100 characters.";
    },
    {
      code: 6007;
      name: "descriptionTooLong";
      msg: "The description is too long. Maximum length is 200 characters.";
    },
  ];
  types: [
    {
      name: "entry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "value";
            type: "u64";
          },
          {
            name: "isClaimed";
            type: "bool";
          },
        ];
      };
    },
    {
      name: "optionCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolAccount";
            type: "pubkey";
          },
          {
            name: "option";
            type: "pubkey";
          },
          {
            name: "title";
            type: "string";
          },
        ];
      };
    },
    {
      name: "pool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "title";
            type: "string";
          },
          {
            name: "isPaused";
            type: "bool";
          },
          {
            name: "winningOption";
            type: "pubkey";
          },
          {
            name: "value";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "poolCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolAccount";
            type: "pubkey";
          },
          {
            name: "title";
            type: "string";
          },
          {
            name: "imageUrl";
            type: "string";
          },
          {
            name: "description";
            type: "string";
          },
        ];
      };
    },
    {
      name: "poolEntered";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "option";
            type: "pubkey";
          },
          {
            name: "entry";
            type: "pubkey";
          },
          {
            name: "value";
            type: "u64";
          },
          {
            name: "entrant";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "poolOption";
      type: {
        kind: "struct";
        fields: [
          {
            name: "title";
            type: "string";
          },
          {
            name: "value";
            type: "u64";
          },
        ];
      };
    },
  ];
};
