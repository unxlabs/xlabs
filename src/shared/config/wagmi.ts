import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { bsc, mainnet, arbitrum } from "wagmi/chains";

import {
  mode,
  core,
  hemi,
  b2Network,
  plume,
  goat,
  aiLayer,
  bitlayer,
  zkLinkNova,
  merlin,
  exSat,
  linea,
  scroll,
  hashkey,
  morph,
  monad,
} from "./customChains";

const projectId = import.meta.env.VITE_WC_PROJECT_ID as string;

if (!projectId) {
  console.warn("Missing VITE_WC_PROJECT_ID in .env");
}

const ICON_BG = "rgba(2,15,40,0.65)";

const arbitrumWithIcon = {
  ...arbitrum,
  iconUrl: "https://desyn.io/img/arbitrum.1a223d40.png",
  iconBackground: ICON_BG,
};

export const wagmiConfig = getDefaultConfig({
  appName: "Unlimited X Labs",
  projectId: projectId || "MISSING_PROJECT_ID",

  chains: [
    bsc,
    mainnet,
    arbitrumWithIcon,

    mode,
    core,
    hemi,
    b2Network,
    plume,
    goat,
    aiLayer,
    bitlayer,
    zkLinkNova,
    merlin,
    exSat,
    linea,
    scroll,
    hashkey,
    morph,
    monad,
  ],

  transports: {
    [bsc.id]: http(bsc.rpcUrls.default.http[0]),
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
    [arbitrumWithIcon.id]: http(arbitrum.rpcUrls.default.http[0]),

    [mode.id]: http(mode.rpcUrls.default.http[0]),
    [core.id]: http(core.rpcUrls.default.http[0]),
    [hemi.id]: http(hemi.rpcUrls.default.http[0]),
    [b2Network.id]: http(b2Network.rpcUrls.default.http[0]),
    [plume.id]: http(plume.rpcUrls.default.http[0]),
    [goat.id]: http(goat.rpcUrls.default.http[0]),
    [aiLayer.id]: http(aiLayer.rpcUrls.default.http[0]),
    [bitlayer.id]: http(bitlayer.rpcUrls.default.http[0]),
    [zkLinkNova.id]: http(zkLinkNova.rpcUrls.default.http[0]),
    [merlin.id]: http(merlin.rpcUrls.default.http[0]),
    [exSat.id]: http(exSat.rpcUrls.default.http[0]),
    [linea.id]: http(linea.rpcUrls.default.http[0]),
    [scroll.id]: http(scroll.rpcUrls.default.http[0]),
    [hashkey.id]: http(hashkey.rpcUrls.default.http[0]),
    [morph.id]: http(morph.rpcUrls.default.http[0]),
    [monad.id]: http(monad.rpcUrls.default.http[0]),
  },
});
