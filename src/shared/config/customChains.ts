import type { Chain } from "viem";

type ChainWithIcon = Chain & {
  iconUrl?: string;
  iconBackground?: string;
};

const ETH = { name: "Ether", symbol: "ETH", decimals: 18 } as const;
const BTC = { name: "Bitcoin", symbol: "BTC", decimals: 18 } as const;

const ICON_BG = "rgba(2,15,40,0.65)";

/** Mode */
export const mode: ChainWithIcon = {
  id: 34443,
  name: "Mode",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://mainnet.mode.network"] },
    public: { http: ["https://mainnet.mode.network"] },
  },
  blockExplorers: {
    default: { name: "Mode Explorer", url: "https://explorer.mode.network" },
  },
  iconUrl: "https://desyn.io/img/mode.7994c0d3.png",
  iconBackground: ICON_BG,
};

/** Core */
export const core: ChainWithIcon = {
  id: 1116,
  name: "Core",
  nativeCurrency: { name: "Core", symbol: "CORE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.coredao.org"] },
    public: { http: ["https://rpc.coredao.org"] },
  },
  blockExplorers: {
    default: { name: "Core Scan", url: "https://scan.coredao.org" },
  },
  iconUrl: "https://desyn.io/img/core.87597d79.png",
  iconBackground: ICON_BG,
};

/** Hemi */
export const hemi: ChainWithIcon = {
  id: 43111,
  name: "Hemi",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://rpc.hemi.network/rpc"] },
    public: { http: ["https://rpc.hemi.network/rpc"] },
  },
  blockExplorers: {
    default: { name: "Hemi Explorer", url: "https://explorer.hemi.xyz" },
  },
  iconUrl: "https://desyn.io/img/hemi.1cbf6fd9.png",
  iconBackground: ICON_BG,
};

/** B² Network */
export const b2Network: ChainWithIcon = {
  id: 223,
  name: "B² Network",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://rpc.bsquared.network"] },
    public: { http: ["https://rpc.bsquared.network"] },
  },
  blockExplorers: {
    default: { name: "B² Explorer", url: "https://explorer.bsquared.network" },
  },
  iconUrl: "https://desyn.io/img/b2.c05c8b4e.png",
  iconBackground: ICON_BG,
};

/** Plume */
export const plume: ChainWithIcon = {
  id: 98866,
  name: "Plume",
  nativeCurrency: { name: "Plume", symbol: "PLUME", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.plume.org"] },
    public: { http: ["https://rpc.plume.org"] },
  },
  blockExplorers: {
    default: { name: "Plume Explorer", url: "https://explorer.plume.org" },
  },
  iconUrl: "https://desyn.io/img/plume.a05da7a6.png",
  iconBackground: ICON_BG,
};

/** GOAT Network */
export const goat: ChainWithIcon = {
  id: 2345,
  name: "GOAT Network",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://rpc.goat.network"] },
    public: { http: ["https://rpc.goat.network"] },
  },
  blockExplorers: {
    default: { name: "GOAT Explorer", url: "https://explorer.goat.network" },
  },
  iconUrl: "https://desyn.io/img/goat.0bda5dc5.png",
  iconBackground: ICON_BG,
};

/** AILayer */
export const aiLayer: ChainWithIcon = {
  id: 2649,
  name: "AILayer",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://mainnet-rpc.ailayer.xyz"] },
    public: { http: ["https://mainnet-rpc.ailayer.xyz"] },
  },
  blockExplorers: {
    default: { name: "AILayer Explorer", url: "https://mainnet-explorer.ailayer.xyz" },
  },
  iconUrl: "https://desyn.io/img/ailayer.ddb13cc3.png",
  iconBackground: ICON_BG,
};

/** Bitlayer */
export const bitlayer: ChainWithIcon = {
  id: 200901,
  name: "Bitlayer",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://rpc.bitlayer.org"] },
    public: { http: ["https://rpc.bitlayer.org"] },
  },
  blockExplorers: {
    default: { name: "BTRScan", url: "https://www.btrscan.com" },
  },
  iconUrl: "https://desyn.io/img/bitlayer.ae1a2f5f.png",
  iconBackground: ICON_BG,
};

/** zkLink Nova */
export const zkLinkNova: ChainWithIcon = {
  id: 810180,
  name: "zkLink Nova",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://rpc.zklink.io"] },
    public: { http: ["https://rpc.zklink.io"] },
  },
  blockExplorers: {
    default: { name: "zkLink Explorer", url: "https://explorer.zklink.io" },
  },
  iconUrl: "https://desyn.io/img/zklink.f3ab3f7f.png",
  iconBackground: ICON_BG,
};

/** Merlin (no logo provided) */
export const merlin: ChainWithIcon = {
  id: 4200,
  name: "Merlin",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://rpc.merlinchain.io"] },
    public: { http: ["https://rpc.merlinchain.io"] },
  },
  blockExplorers: {
    default: { name: "Merlin Scan", url: "https://scan.merlinchain.io" },
  },
  iconBackground: ICON_BG,
};

/** exSat */
export const exSat: ChainWithIcon = {
  id: 7200,
  name: "exSat",
  nativeCurrency: BTC,
  rpcUrls: {
    default: { http: ["https://evm.exsat.network"] },
    public: { http: ["https://evm.exsat.network"] },
  },
  blockExplorers: {
    default: { name: "exSat Scan", url: "https://scan.exsat.network" },
  },
  iconUrl: "https://desyn.io/img/exsat.b5e25b16.png",
  iconBackground: ICON_BG,
};

/** Linea */
export const linea: ChainWithIcon = {
  id: 59144,
  name: "Linea",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://rpc.linea.build"] },
    public: { http: ["https://rpc.linea.build"] },
  },
  blockExplorers: {
    default: { name: "LineaScan", url: "https://lineascan.build" },
  },
  iconUrl: "https://desyn.io/img/linea.76e12de5.png",
  iconBackground: ICON_BG,
};

/** Scroll */
export const scroll: ChainWithIcon = {
  id: 534352,
  name: "Scroll",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://rpc.scroll.io"] },
    public: { http: ["https://rpc.scroll.io"] },
  },
  blockExplorers: {
    default: { name: "Scrollscan", url: "https://scrollscan.com" },
  },
  iconUrl: "https://desyn.io/img/scroll.0959574a.png",
  iconBackground: ICON_BG,
};

/** HashKey Chain */
export const hashkey: ChainWithIcon = {
  id: 177,
  name: "HashKey Chain",
  nativeCurrency: { name: "HashKey", symbol: "HSK", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.hsk.xyz"] },
    public: { http: ["https://mainnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: { name: "HSK Explorer", url: "https://explorer.hsk.xyz" },
  },
  iconUrl: "https://desyn.io/img/hashkey.b33873db.png",
  iconBackground: ICON_BG,
};

/** Morph */
export const morph: ChainWithIcon = {
  id: 2818,
  name: "Morph",
  nativeCurrency: ETH,
  rpcUrls: {
    default: { http: ["https://rpc.morphl2.io"] },
    public: { http: ["https://rpc.morphl2.io"] },
  },
  blockExplorers: {
    default: { name: "Morph Explorer", url: "https://explorer.morphl2.io" },
  },
  iconUrl: "https://desyn.io/img/morph.7133a693.png",
  iconBackground: ICON_BG,
};

/** Monad */
export const monad: ChainWithIcon = {
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
    public: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://monadscan.com" },
  },
  iconUrl: "https://desyn.io/img/monad.572a58b1.png",
  iconBackground: ICON_BG,
};
