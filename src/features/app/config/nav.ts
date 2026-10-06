export type NavItem = {
  label: string;
  to: string;
  kind?: "internal" | "external";
};

export const APP_LINKS: NavItem[] = [
  {
    label: "Portfolio",
    to: "/app",
    kind: "internal",
  },
  {
    label: "Earn",
    to: "/app/earn?asset=btc",
    kind: "internal",
  },
  {
    label: "Stake",
    to: "/app/stake",
    kind: "internal",
  },
  {
    label: "Genesis Pass",
    to: "/app/genesis",
    kind: "internal",
  },
  {
    label: "Rewards",
    to: "/app/rewards",
    kind: "internal",
  },
  {
    label: "Airdrop",
    to: "/app/airdrop",
    kind: "internal",
  },
  {
    label: "Leaderboard",
    to: "/app/leaderboard",
    kind: "internal",
  },
  {
    label: "Campaigns",
    to: "/app/campaigns",
    kind: "internal",
  },
  {
    label: "Referrals",
    to: "/app/referrals",
    kind: "internal",
  },
  {
    label: "History",
    to: "/app/history",
    kind: "internal",
  },
  {
    label: "Ecosystem",
    to: "/app/ecosystem",
    kind: "internal",
  },
  {
    label: "Tokenomics",
    to: "/app/tokenomics",
    kind: "internal",
  },
  {
    label: "Learn",
    to: "/app/learn",
    kind: "internal",
  },
];

/*
  External community links stay empty until the official
  Unlimited X Labs links are ready.

  Do not use placeholder URLs here because they would send
  users to unrelated pages.
*/
export const SOCIAL_LINKS: NavItem[] = [];