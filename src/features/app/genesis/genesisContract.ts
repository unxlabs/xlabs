import type { Address } from "viem";

export const GENESIS_CONTRACT =
  "0x3d71D114B58bd47477BDf5DEF6620a5b0F23842E" as Address;

export const USDT_CONTRACT =
  "0x55d398326f99059fF775485246999027B3197955" as Address;

export const GENESIS_PASS_ID = 1n;
export const BSC_CHAIN_ID = 56;

export const GENESIS_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "PRICE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "remainingSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "passesOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "uri",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
] as const;

export const USDT_ABI = [
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
] as const;

export type GenesisTier = {
  name: string;
  min: number;
  xp: string;
  referral: string;
};

export const GENESIS_TIERS: GenesisTier[] = [
  {
    name: "Genesis",
    min: 1,
    xp: "+10%",
    referral: "+5%",
  },
  {
    name: "Genesis+",
    min: 3,
    xp: "+20%",
    referral: "+10%",
  },
  {
    name: "Elite",
    min: 5,
    xp: "+30%",
    referral: "+15%",
  },
  {
    name: "Apex",
    min: 10,
    xp: "+40%",
    referral: "+20%",
  },
  {
    name: "Prime",
    min: 25,
    xp: "+55%",
    referral: "+25%",
  },
  {
    name: "Founder",
    min: 50,
    xp: "+75%",
    referral: "+35%",
  },
];

export function getGenesisTier(balance: bigint) {
  const amount = Number(balance);

  return (
    [...GENESIS_TIERS]
      .reverse()
      .find((tier) => amount >= tier.min) ?? null
  );
}