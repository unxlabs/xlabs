import type { Address } from "viem";

/* =========================================================
   UNLIMITED X LABS — STAKING CONTRACTS
   BNB Smart Chain Mainnet
   ========================================================= */

export const BNB_STAKING_CONTRACT =
  "0x3b2A4eFF7FC2C18fF11d6a687342eCAB4E4512f6" as Address;

export const USDT_STAKING_CONTRACT =
  "0xa381410664bB7bE241aA456D2C3130474E28013d" as Address;

export const BTC_STAKING_CONTRACT =
  "0xd436FBbA8C770862B815D575519347Fb6E450978" as Address;

/* =========================================================
   TOKEN CONTRACTS
   ========================================================= */

export const USDT_TOKEN =
  "0x55d398326f99059fF775485246999027B3197955" as Address;

export const BTCB_TOKEN =
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" as Address;

/* =========================================================
   POOLS
   ========================================================= */

export const BNB_POOL_ID = 1n;
export const USDT_POOL_ID = 1n;
export const BTC_POOL_ID = 1n;

/* =========================================================
   SHARED READ / POSITION ABI
   ========================================================= */

const sharedStakingAbi = [
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
          {
            name: "fundedForWithdrawal",
            type: "uint256",
          },
          { name: "createdAt", type: "uint64" },
          { name: "lockStartedAt", type: "uint64" },
          { name: "lockEndsAt", type: "uint64" },
          {
            name: "unlockRequestedAt",
            type: "uint64",
          },
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

/* =========================================================
   BNB STAKING ABI

   Native BNB:
   stake(poolId)
   payable
   ========================================================= */

export const bnbStakingAbi = [
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [{ name: "positionId", type: "uint256" }],
  },

  ...sharedStakingAbi,
] as const;

/* =========================================================
   TOKEN STAKING ABI

   USDT / BTCB:
   stake(poolId, amount)
   ========================================================= */

export const tokenStakingAbi = [
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "positionId", type: "uint256" }],
  },

  ...sharedStakingAbi,
] as const;

/* =========================================================
   ERC-20 ABI

   Used for:
   - wallet balance
   - allowance
   - approve
   ========================================================= */

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

/*
  Compatibility alias.

  Keep this temporarily so any other part of the
  project that still imports stakingAbi does not break.
*/
export const stakingAbi = bnbStakingAbi;