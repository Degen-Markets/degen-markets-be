/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/degen_pools.json`.
 */
export type DegenPools = {
  address: "5nxUTpb7KpQU3jPvKDtpxT1wYu13ffMQCKLyxKXUNa4Z";
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
      name: "closeEntryAccount";
      discriminator: [213, 5, 140, 23, 10, 150, 49, 6];
      accounts: [
        {
          name: "entrant";
          writable: true;
          signer: true;
        },
        {
          name: "entryAccount";
          writable: true;
        },
        {
          name: "optionAccount";
        },
      ];
      args: [];
    },
    {
      name: "closeOptionAccount";
      discriminator: [46, 121, 107, 240, 123, 190, 229, 1];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
          address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
        },
        {
          name: "optionAccount";
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "closePoolAccount";
      discriminator: [242, 65, 17, 36, 124, 151, 197, 198];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
          address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
        },
        {
          name: "poolAccount";
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "concludePool";
      discriminator: [199, 173, 61, 93, 106, 141, 5, 133];
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
      name: "poolConcluded";
      msg: "Pool has concluded!";
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
      name: "pool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "title";
            type: "string";
          },
          {
            name: "hasConcluded";
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
