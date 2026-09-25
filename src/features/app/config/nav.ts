export type NavItem = {
  label: string;
  to: string;
  kind?: "internal" | "external";
};

export const APP_LINKS: NavItem[] = [
  { label: "Portfolio", to: "/app", kind: "internal" },
  { label: "Stake", to: "/app/stake", kind: "internal" },
  { label: "Genesis Pass", to: "/app/genesis", kind: "internal" },
  { label: "Rewards", to: "/app/rewards", kind: "internal" },
  { label: "History", to: "/app/history", kind: "internal" },
  { label: "Ecosystem", to: "/app/ecosystem", kind: "internal" },
  { label: "Learn", to: "/app/learn", kind: "internal" },
];

export const SOCIAL_LINKS: NavItem[] = [
  { label: "X", to: "https://x.com/", kind: "external" },
  { label: "Telegram", to: "https://t.me/", kind: "external" },
  { label: "Discord", to: "https://discord.com/", kind: "external" },
  { label: "Docs", to: "https://docs.example.com", kind: "external" },
];