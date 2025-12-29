import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc } from "wagmi/chains";
import { http } from "viem";

const projectId = import.meta.env.VITE_WC_PROJECT_ID as string;

if (!projectId) {
  console.warn("Missing VITE_WC_PROJECT_ID in .env");
}

export const wagmiConfig = getDefaultConfig({
  appName: "Unlimited X Labs",
  projectId: projectId || "MISSING_PROJECT_ID",
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
});
