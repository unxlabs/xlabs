import type { Address } from "viem";

export const BNB_STAKING_CONTRACT =
  "0x3b2A4eFF7FC2C18fF11d6a687342eCAB4E4512f6" as Address;

export const BNB_POOL_ID = 1n;

/*
  بعد نشر عقود BTC وUSDT لاحقًا:
  فقط ضع العناوين الصحيحة هنا.
*/
export const BTC_STAKING_CONTRACT: Address | null = null;
export const USDT_STAKING_CONTRACT: Address | null = null;

export const stakingAbi = [
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [{ name: "positionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "requestUnlock",
    stateMutability: "nonpayable",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getUserStats",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "deposited", type: "uint256" },
      { name: "withdrawn", type: "uint256" },
      { name: "active", type: "uint256" },
      { name: "positionCount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getUserPositionIds",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getPosition",
    stateMutability: "view",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "poolId", type: "uint256" },
          { name: "user", type: "address" },
          { name: "principal", type: "uint256" },
          { name: "fundedForWithdrawal", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "lockStartedAt", type: "uint64" },
          { name: "lockEndsAt", type: "uint64" },
          { name: "unlockRequestedAt", type: "uint64" },
          { name: "claimableAt", type: "uint64" },
          { name: "withdrawnAt", type: "uint64" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "totalDeposited",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "activePrincipal",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalWithdrawn",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "uniqueStakers",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositsPaused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;