import type { Address } from "viem";

/* =========================================================
   Unlimited X Labs — Earn Contracts
   BNB Chain Mainnet
   ========================================================= */

export const BFBTC_VAULT =
  "0x701819f06804398304fDE6b7f46278bDF1Cfa39F" as Address;

export const BFUSD_VAULT =
  "0xeff37c33EFA31a7ae87db4f09f260562f900C719" as Address;

export const BTCB_TOKEN =
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" as Address;

export const USDT_TOKEN =
  "0x55d398326f99059fF775485246999027B3197955" as Address;

/* =========================================================
   Position Status
   ========================================================= */

export const POSITION_STATUS = {
  0: "NONE",
  1: "ACTIVE",
  2: "WITHDRAWAL_REQUESTED",
  3: "CLAIMABLE",
  4: "WITHDRAWN",
} as const;

/* =========================================================
   Earn Vault ABI
   ========================================================= */

export const earnVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "positionId",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "requestWithdrawal",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "positionId",
        type: "uint256",
      },
    ],
    outputs: [],
  },

  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "positionId",
        type: "uint256",
      },
    ],
    outputs: [],
  },

  {
    type: "function",
    name: "getPosition",
    stateMutability: "view",
    inputs: [
      {
        name: "id",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          {
            name: "id",
            type: "uint256",
          },
          {
            name: "user",
            type: "address",
          },
          {
            name: "principal",
            type: "uint256",
          },
          {
            name: "createdAt",
            type: "uint256",
          },
          {
            name: "withdrawalRequestedAt",
            type: "uint256",
          },
          {
            name: "fundedAt",
            type: "uint256",
          },
          {
            name: "withdrawnAt",
            type: "uint256",
          },
          {
            name: "withdrawalFunded",
            type: "uint256",
          },
          {
            name: "status",
            type: "uint8",
          },
        ],
      },
    ],
  },

  {
    type: "function",
    name: "getUserPositionIds",
    stateMutability: "view",
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
      },
    ],
  },

  {
    type: "function",
    name: "getUserPositionCount",
    stateMutability: "view",
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "getUserPositionIdAt",
    stateMutability: "view",
    inputs: [
      {
        name: "user",
        type: "address",
      },
      {
        name: "index",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "getUserStats",
    stateMutability: "view",
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
      {
        name: "",
        type: "uint256",
      },
      {
        name: "",
        type: "uint256",
      },
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "amountNeededForPosition",
    stateMutability: "view",
    inputs: [
      {
        name: "id",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "activePrincipal",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "activePositions",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "totalPositions",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "totalDeposited",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "totalForwarded",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "totalWithdrawn",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "uniqueDepositors",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "userActivePrincipal",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "userTotalDeposited",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "userTotalWithdrawn",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "depositsPaused",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },

  {
    type: "function",
    name: "withdrawalsPaused",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },

  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },

  {
    type: "function",
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
] as const;

/* =========================================================
   ERC20 ABI
   ========================================================= */

export const earnTokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },

  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
  },

  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
] as const;