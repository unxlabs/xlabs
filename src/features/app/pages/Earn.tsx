import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits, parseUnits, type Address } from "viem";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bitcoin,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  Flame,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import styles from "./Earn.module.css";
import { getMyPositions, type IndexedPosition } from "../../../shared/api/positions";


import {
  BFBTC_VAULT,
  BFUSD_VAULT,
  BTCB_TOKEN,
  USDT_TOKEN,
  earnTokenAbi,
  earnVaultAbi,
} from "../earn/earnContracts";

/* =========================================================
   TYPES
   ========================================================= */

type EarnAsset = "BTC" | "USD";

type Position = {
  id: bigint;
  user: Address;
  principal: bigint;
  createdAt: bigint;
  withdrawalRequestedAt: bigint;
  fundedAt: bigint;
  withdrawnAt: bigint;
  withdrawalFunded: bigint;
  status: number;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const POSITION_STATUS: Record<number, string> = {
  0: "None",
  1: "Active",
  2: "Withdrawal Requested",
  3: "Ready to Claim",
  4: "Completed",
};

const ASSET_CONFIG = {
  BTC: {
    product: "bfBTC",
    symbol: "BTCB",
    title: "Bitcoin Yield",
    subtitle: "Put your Bitcoin to work",
    description:
      "Build your bfBTC position and participate in the Unlimited X yield ecosystem.",
    vault: BFBTC_VAULT,
    token: BTCB_TOKEN,
    decimals: 18,
    apy: "6.95%",
    apyLabel: "Displayed APY",
    contractShort: "0x7018...a39F",
  },

  USD: {
    product: "bfUSD",
    symbol: "USDT",
    title: "USD Yield",
    subtitle: "Activate your stablecoin position",
    description:
      "Build your bfUSD position and participate in the Unlimited X yield ecosystem.",
    vault: BFUSD_VAULT,
    token: USDT_TOKEN,
    decimals: 18,
    apy: "87.85% ~ 118.99%",
    apyLabel: "Displayed APY",
    contractShort: "0xeff3...C719",
  },
} as const;

/* =========================================================
   HELPERS
   ========================================================= */

function formatAssetAmount(
  value: bigint | undefined,
  decimals: number,
  maximumFractionDigits = 4,
) {
  if (value === undefined) return "0";

  const number = Number(formatUnits(value, decimals));

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function formatInputAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals);
  const [whole, decimal = ""] = raw.split(".");

  const trimmed = decimal.slice(0, 8).replace(/0+$/, "");

  return trimmed ? `${whole}.${trimmed}` : whole;
}

function formatDate(timestamp: bigint) {
  if (timestamp === 0n) return "—";

  const date = new Date(Number(timestamp) * 1000);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   PAGE
   ========================================================= */

export default function Earn() {
  const { address, isConnected } = useAccount();

  const chainId = useChainId();

  const { switchChainAsync } = useSwitchChain();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialAsset =
    searchParams.get("asset") === "usd" ? "USD" : "BTC";

  const [selectedAsset, setSelectedAsset] =
    useState<EarnAsset>(initialAsset);

  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");

  const [indexedPositions, setIndexedPositions] = useState<IndexedPosition[]>([]);
  const [indexerUpdatedAt, setIndexerUpdatedAt] = useState<number | null>(null);

  async function refreshIndexedPositions() {
    if (!isConnected) {
      setIndexedPositions([]);
      setIndexerUpdatedAt(null);
      return;
    }

    try {
      const response = await getMyPositions();
      setIndexedPositions(response.positions);
      setIndexerUpdatedAt(Date.now());
    } catch {
      // Contract reads remain authoritative for financial actions.
    }
  }

  useEffect(() => {
    void refreshIndexedPositions();
  }, [address, isConnected]);


  useEffect(() => {
    const assetFromUrl: EarnAsset =
      searchParams.get("asset") === "usd" ? "USD" : "BTC";

    setSelectedAsset(assetFromUrl);
  }, [searchParams]);

  const asset = ASSET_CONFIG[selectedAsset];

  /* =======================================================
     URL PRODUCT SELECTION
     ======================================================= */

  function selectAsset(nextAsset: EarnAsset) {
    setSelectedAsset(nextAsset);

    setSearchParams({
      asset: nextAsset === "BTC" ? "btc" : "usd",
    });
  }

  /* =======================================================
     WALLET BALANCE
     ======================================================= */

  const {
    data: walletBalance,
    refetch: refetchBalance,
  } = useBalance({
    address,
    token: asset.token,
    chainId: bsc.id,

    query: {
      enabled: Boolean(address),
    },
  });

  /* =======================================================
     WRITE CONTRACT
     ======================================================= */

  const {
    data: txHash,
    writeContractAsync,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: txConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  /* =======================================================
     VAULT READS
     ======================================================= */

  const {
    data: depositsPaused,
    refetch: refetchDepositsPaused,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "depositsPaused",
    chainId: bsc.id,
  });

  const {
    data: withdrawalsPaused,
    refetch: refetchWithdrawalsPaused,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "withdrawalsPaused",
    chainId: bsc.id,
  });

  const {
    data: uniqueDepositors,
    refetch: refetchUniqueDepositors,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "uniqueDepositors",
    chainId: bsc.id,
  });

  const {
    data: activePositions,
    refetch: refetchActivePositions,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "activePositions",
    chainId: bsc.id,
  });

  const {
    data: userStats,
    refetch: refetchUserStats,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    chainId: bsc.id,

    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: positionIds,
    refetch: refetchPositionIds,
  } = useReadContract({
    address: asset.vault,
    abi: earnVaultAbi,
    functionName: "getUserPositionIds",
    args: address ? [address] : undefined,
    chainId: bsc.id,

    query: {
      enabled: Boolean(address),
    },
  });

  /* =======================================================
     TOKEN ALLOWANCE
     ======================================================= */

  const {
    data: tokenAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: asset.token,
    abi: earnTokenAbi,
    functionName: "allowance",
    args: address
      ? [address, asset.vault]
      : undefined,
    chainId: bsc.id,

    query: {
      enabled: Boolean(address),
    },
  });

  /* =======================================================
     POSITIONS
     ======================================================= */

  const positionContracts = useMemo(() => {
    if (!positionIds) return [];

    return positionIds.map((positionId) => ({
      address: asset.vault,
      abi: earnVaultAbi,
      functionName: "getPosition" as const,
      args: [positionId] as const,
      chainId: bsc.id,
    }));
  }, [positionIds, asset.vault]);

  const {
    data: positionsData,
    refetch: refetchPositions,
  } = useReadContracts({
    contracts: positionContracts,

    query: {
      enabled: positionContracts.length > 0,
    },
  });

  const positions = useMemo(() => {
    if (!positionsData) return [];

    return positionsData
      .filter(
        (item) =>
          item.status === "success" &&
          item.result,
      )
      .map(
        (item) =>
          item.result as unknown as Position,
      );
  }, [positionsData]);

  /* =======================================================
     USER VALUES
     ======================================================= */

  const userDeposited = userStats?.[0] ?? 0n;
  const userWithdrawn = userStats?.[1] ?? 0n;
  const userActive = userStats?.[2] ?? 0n;
  const userPositionCount = userStats?.[3] ?? 0n;

  const busy = isWriting || isConfirming;

  /* =======================================================
     PARSED AMOUNT
     ======================================================= */

  const parsedAmount = useMemo(() => {
    if (!amount.trim()) return 0n;

    try {
      return parseUnits(
        amount.trim(),
        asset.decimals,
      );
    } catch {
      return 0n;
    }
  }, [amount, asset.decimals]);

  const needsApproval =
    parsedAmount > 0n &&
    (tokenAllowance ?? 0n) < parsedAmount;

  /* =======================================================
     NETWORK
     ======================================================= */

  async function ensureBsc() {
    if (chainId === bsc.id) {
      return true;
    }

    try {
      await switchChainAsync({
        chainId: bsc.id,
      });

      return true;
    } catch {
      setMessage(
        "Please switch your wallet to BNB Smart Chain.",
      );

      return false;
    }
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  async function refreshData() {
    await Promise.all([
      refetchBalance(),
      refetchDepositsPaused(),
      refetchWithdrawalsPaused(),
      refetchUniqueDepositors(),
      refetchActivePositions(),
      refetchUserStats(),
      refetchPositionIds(),
      refetchPositions(),
      refetchAllowance(),
      refreshIndexedPositions(),
    ]);
  }

  /* =======================================================
     PERCENTAGE BUTTONS
     ======================================================= */

  function setPercentage(percent: number) {
    if (!walletBalance?.value) {
      setAmount("");
      return;
    }

    const selected =
      (walletBalance.value * BigInt(percent)) /
      100n;

    setAmount(
      formatInputAmount(
        selected,
        asset.decimals,
      ),
    );
  }

  /* =======================================================
     APPROVE
     ======================================================= */

  async function handleApprove() {
    setMessage("");

    if (!isConnected || !address) {
      setMessage("Connect your wallet first.");
      return;
    }

    if (parsedAmount <= 0n) {
      setMessage(
        `Enter the amount of ${asset.symbol} you want to use.`,
      );
      return;
    }

    if (
      walletBalance?.value !== undefined &&
      parsedAmount > walletBalance.value
    ) {
      setMessage(
        `Insufficient ${asset.symbol} balance.`,
      );
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage(
        `Approve ${asset.symbol} in your wallet.`,
      );

      await writeContractAsync({
        address: asset.token,
        abi: earnTokenAbi,
        functionName: "approve",
        args: [
          asset.vault,
          parsedAmount,
        ],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  /* =======================================================
     DEPOSIT
     ======================================================= */

  async function handleDeposit() {
    setMessage("");

    if (!isConnected || !address) {
      setMessage("Connect your wallet first.");
      return;
    }

    if (!amount.trim()) {
      setMessage(
        `Enter the amount of ${asset.symbol} you want to use.`,
      );
      return;
    }

    let value: bigint;

    try {
      value = parseUnits(
        amount.trim(),
        asset.decimals,
      );
    } catch {
      setMessage(
        `Enter a valid ${asset.symbol} amount.`,
      );
      return;
    }

    if (value <= 0n) {
      setMessage(
        `Amount must be greater than 0 ${asset.symbol}.`,
      );
      return;
    }

    if (
      walletBalance?.value !== undefined &&
      value > walletBalance.value
    ) {
      setMessage(
        `Insufficient ${asset.symbol} balance.`,
      );
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    if ((tokenAllowance ?? 0n) < value) {
      await handleApprove();
      return;
    }

    try {
      setMessage(
        `Confirm your ${asset.product} deposit in your wallet.`,
      );

      await writeContractAsync({
        address: asset.vault,
        abi: earnVaultAbi,
        functionName: "deposit",
        args: [value],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  /* =======================================================
     REQUEST WITHDRAWAL
     ======================================================= */

  async function handleRequestWithdrawal(
    positionId: bigint,
  ) {
    setMessage("");

    if (!isConnected) {
      setMessage("Connect your wallet first.");
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage(
        "Confirm the withdrawal request in your wallet.",
      );

      await writeContractAsync({
        address: asset.vault,
        abi: earnVaultAbi,
        functionName: "requestWithdrawal",
        args: [positionId],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  /* =======================================================
     WITHDRAW
     ======================================================= */

  async function handleWithdraw(
    positionId: bigint,
  ) {
    setMessage("");

    if (!isConnected) {
      setMessage("Connect your wallet first.");
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage(
        `Confirm your ${asset.symbol} withdrawal in your wallet.`,
      );

      await writeContractAsync({
        address: asset.vault,
        abi: earnVaultAbi,
        functionName: "withdraw",
        args: [positionId],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  /* =======================================================
     TX CONFIRMED
     ======================================================= */

  useEffect(() => {
    if (!txConfirmed) return;

    setMessage(
      "Transaction confirmed successfully.",
    );

    void refreshData();
  }, [txConfirmed]);

  /* =======================================================
     WRITE ERROR
     ======================================================= */

  useEffect(() => {
    if (!writeError) return;

    const rejected =
      writeError.message.includes("User rejected") ||
      writeError.message.includes("User denied");

    setMessage(
      rejected
        ? "Transaction cancelled."
        : "Transaction failed. Please check your wallet and try again.",
    );
  }, [writeError]);

  /* =======================================================
     ASSET CHANGE
     ======================================================= */

  useEffect(() => {
    setAmount("");
    setMessage("");
  }, [selectedAsset]);

  /* =======================================================
     BUTTON LABEL
     ======================================================= */

  function getActionButtonLabel() {
    if (depositsPaused) {
      return "Deposits Paused";
    }

    if (isWriting) {
      return "Confirm in Wallet...";
    }

    if (isConfirming) {
      return "Confirming...";
    }

    if (!isConnected) {
      return "Connect Wallet to Earn";
    }

    if (needsApproval) {
      return `Approve ${asset.symbol}`;
    }

    return `Start Earning with ${asset.product}`;
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div
      className={`${styles.page} ${
        selectedAsset === "BTC"
          ? styles.btcTheme
          : styles.usdTheme
      }`}
    >
      {/* HERO */}

      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <Flame size={14} />
            UNLIMITED EARN
            <span>LIVE</span>
          </div>

          <h1>
            Put Your Assets
            <br />
            <em>to Work.</em>
          </h1>

          <p>
            Activate your assets inside the Unlimited X
            ecosystem and build your on-chain position.
          </p>

          <div className={styles.heroPills}>
            <span>
              <ShieldCheck size={14} />
              On-chain positions
            </span>

            <span>
              <Zap size={14} />
              BNB Chain
            </span>

            <span>
              <Layers3 size={14} />
              Flexible size
            </span>
          </div>
        </div>

        <div className={styles.heroMetric}>
          <span>{asset.product}</span>

          <strong>{asset.apy}</strong>

          <small>{asset.apyLabel}</small>

          <div className={styles.metricPulse}>
            <i />
            Product live
          </div>
        </div>
      </section>

      {/* PRODUCT SWITCHER */}

      <section className={styles.productSelector}>
        <button
          type="button"
          className={`${styles.productTab} ${
            selectedAsset === "BTC"
              ? styles.productTabActive
              : ""
          }`}
          onClick={() => selectAsset("BTC")}
        >
          <div
            className={`${styles.productIcon} ${styles.btcIcon}`}
          >
            <Bitcoin size={22} />
          </div>

          <div className={styles.productTabText}>
            <span>BITCOIN YIELD</span>
            <strong>bfBTC</strong>
            <small>Powered by BTCB</small>
          </div>

          <div className={styles.productApy}>
            <small>APY</small>
            <strong>6.95%</strong>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.productTab} ${
            selectedAsset === "USD"
              ? styles.productTabActive
              : ""
          }`}
          onClick={() => selectAsset("USD")}
        >
          <div
            className={`${styles.productIcon} ${styles.usdIcon}`}
          >
            $
          </div>

          <div className={styles.productTabText}>
            <span>USD YIELD</span>
            <strong>bfUSD</strong>
            <small>Powered by USDT</small>
          </div>

          <div className={styles.productApy}>
            <small>APY</small>
            <strong>87.85% ~ 118.99%</strong>
          </div>
        </button>
      </section>

      {/* MAIN */}

      <div className={styles.mainGrid}>
        <section className={styles.earnCard}>
          <div className={styles.cardTop}>
            <div>
              <span className={styles.smallLabel}>
                {asset.product} POSITION
              </span>

              <h2>{asset.subtitle}</h2>
            </div>

            <div className={styles.walletBalance}>
              <Wallet size={16} />

              <div>
                <span>Wallet balance</span>

                <strong>
                  {isConnected
                    ? `${formatAssetAmount(
                        walletBalance?.value,
                        asset.decimals,
                        6,
                      )} ${asset.symbol}`
                    : "Not connected"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.amountLabel}>
            <span>Amount</span>
            <small>{asset.symbol}</small>
          </div>

          <div className={styles.amountBox}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />

            <div className={styles.amountAsset}>
              <span
                className={`${styles.miniAsset} ${
                  selectedAsset === "BTC"
                    ? styles.miniBtc
                    : styles.miniUsd
                }`}
              >
                {selectedAsset === "BTC" ? "₿" : "$"}
              </span>

              {asset.symbol}
            </div>
          </div>

          <div className={styles.percentageRow}>
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() =>
                  setPercentage(percent)
                }
                disabled={!isConnected}
              >
                {percent === 100
                  ? "MAX"
                  : `${percent}%`}
              </button>
            ))}
          </div>

          <div className={styles.productInfo}>
            <div>
              <span>Product</span>
              <strong>{asset.product}</strong>
            </div>

            <div>
              <span>Underlying</span>
              <strong>{asset.symbol}</strong>
            </div>

            <div>
              <span>Network</span>
              <strong>BNB Chain</strong>
            </div>

            <div>
              <span>Position size</span>
              <strong>Flexible</strong>
            </div>
          </div>

          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <button
                  className={styles.earnButton}
                  type="button"
                  onClick={openConnectModal}
                  disabled={!mounted}
                >
                  Connect Wallet to Earn
                  <ChevronRight size={20} />
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <button
              className={styles.earnButton}
              type="button"
              onClick={
                needsApproval
                  ? handleApprove
                  : handleDeposit
              }
              disabled={
                busy ||
                depositsPaused === true
              }
            >
              {getActionButtonLabel()}

              {!busy && <ChevronRight size={20} />}
            </button>
          )}

          {isConnected && needsApproval && (
            <div className={styles.approvalNotice}>
              <ShieldCheck size={15} />

              <span>
                Approve only the amount you entered.
                After confirmation, press the button
                again to activate your position.
              </span>
            </div>
          )}

          {message && (
            <div
              className={`${styles.message} ${
                txConfirmed
                  ? styles.messageSuccess
                  : ""
              }`}
            >
              {txConfirmed && (
                <CheckCircle2 size={16} />
              )}

              {message}
            </div>
          )}

          <div className={styles.contractLine}>
            <span>Vault contract</span>

            <code>{asset.contractShort}</code>
          </div>
        </section>

        {/* SIDE */}

        <aside className={styles.sidePanel}>
          <div className={styles.sideHeader}>
            <div>
              <span className={styles.smallLabel}>
                YOUR EARN POSITION
              </span>

              <h3>{asset.product}</h3>
            </div>

            <button
              type="button"
              onClick={() => void refreshData()}
              className={styles.iconButton}
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className={styles.activePosition}>
            <span>Contract active principal</span>

            <strong>
              {formatAssetAmount(
                userActive,
                asset.decimals,
                6,
              )}{" "}
              {asset.symbol}
            </strong>

            <small>
              {userPositionCount.toString()} position
              {userPositionCount === 1n ? "" : "s"}
            </small>
          </div>

          <div className={styles.sideStats}>
            <div>
              <span>Indexed principal</span>

              <strong>
                {formatAssetAmount(
                  indexedPositions
                    .filter((item) =>
                      item.productType === "earn" &&
                      item.contractAddress.toLowerCase() === asset.vault.toLowerCase() &&
                      !item.withdrawnAtChain
                    )
                    .reduce((total, item) => total + BigInt(item.principalAtomic), 0n),
                  asset.decimals,
                  6,
                )}{" "}
                {asset.symbol}
              </strong>
            </div>

            <div>
              <span>Total deposited</span>

              <strong>
                {formatAssetAmount(
                  userDeposited,
                  asset.decimals,
                  6,
                )}{" "}
                {asset.symbol}
              </strong>
            </div>

            <div>
              <span>Withdrawn</span>

              <strong>
                {formatAssetAmount(
                  userWithdrawn,
                  asset.decimals,
                  6,
                )}{" "}
                {asset.symbol}
              </strong>
            </div>
          </div>

          <div className={styles.momentumCard}>
            <div className={styles.momentumIcon}>
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Yield product</span>
              <strong>{asset.apy}</strong>
              <small>{asset.apyLabel}</small>
            </div>
          </div>

          {!isConnected && (
            <div className={styles.connectNotice}>
              <Wallet size={18} />

              Connect your wallet to activate and
              track your {asset.product} positions.
            </div>
          )}
        </aside>
      </div>

      {/* MOMENTUM STRIP */}

      <section className={styles.momentumStrip}>
        <div>
          <Sparkles size={18} />

          <span>
            Product
            <strong>{asset.product}</strong>
          </span>
        </div>

        <div>
          <Coins size={18} />

          <span>
            Asset
            <strong>{asset.symbol}</strong>
          </span>
        </div>

        <div>
          <Layers3 size={18} />

          <span>
            Active positions
            <strong>
              {activePositions?.toString() ?? "0"}
            </strong>
          </span>
        </div>

        <div>
          <Zap size={18} />

          <span>
            Participants
            <strong>
              {uniqueDepositors?.toString() ?? "0"}
            </strong>
          </span>
        </div>
      </section>

      {/* POSITIONS */}

      {isConnected && positions.length > 0 && (
        <section className={styles.positionsSection}>
          <div className={styles.positionsHeader}>
            <div>
              <span className={styles.smallLabel}>
                ON-CHAIN POSITIONS
              </span>

              <h2>Your {asset.product} Positions</h2>
            </div>

            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => void refreshData()}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className={styles.indexerBar}>
            <span><CheckCircle2 size={14} /> Indexer connected</span>
            <span>{indexedPositions.filter((item) => item.productType === "earn" && item.contractAddress.toLowerCase() === asset.vault.toLowerCase()).length} indexed</span>
            <span>{indexerUpdatedAt ? `Synced ${new Date(indexerUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "Syncing…"}</span>
          </div>

          <div className={styles.positionsGrid}>
            {positions.map((position) => {
              if (!position) return null;

              const status = Number(position.status);

              return (
                <article
                  key={position.id.toString()}
                  className={styles.positionCard}
                >
                  <div className={styles.positionCardTop}>
                    <div>
                      <span>POSITION</span>

                      <strong>
                        #{position.id.toString()}
                      </strong>
                    </div>

                    <div
                      className={`${styles.status} ${
                        status === 3
                          ? styles.claimableStatus
                          : ""
                      }`}
                    >
                      {POSITION_STATUS[status] ??
                        "Unknown"}
                    </div>
                  </div>

                  <div className={styles.positionAmount}>
                    <span>Principal</span>

                    <strong>
                      {formatAssetAmount(
                        position.principal,
                        asset.decimals,
                        6,
                      )}{" "}
                      {asset.symbol}
                    </strong>
                  </div>

                  <div className={styles.positionMeta}>
                    <div>
                      <span>Opened</span>

                      <strong>
                        {formatDate(
                          position.createdAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Funded for withdrawal
                      </span>

                      <strong>
                        {formatAssetAmount(
                          position.withdrawalFunded,
                          asset.decimals,
                          6,
                        )}{" "}
                        {asset.symbol}
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const indexed = indexedPositions.find((item) =>
                      item.productType === "earn" &&
                      item.contractAddress.toLowerCase() === asset.vault.toLowerCase() &&
                      item.positionId === Number(position.id),
                    );
                    if (!indexed) return null;
                    const lifecycle = indexed.withdrawnAtChain
                      ? `Completed ${new Date(indexed.withdrawnAtChain * 1000).toLocaleDateString()}`
                      : indexed.claimableAtChain
                        ? `Claimable since ${new Date(indexed.claimableAtChain * 1000).toLocaleDateString()}`
                        : indexed.withdrawalRequestedAtChain
                          ? `Requested ${new Date(indexed.withdrawalRequestedAtChain * 1000).toLocaleDateString()}`
                          : "Active on BNB Chain";
                    return <div className={styles.lifecycleLine}><span>Lifecycle</span><strong>{lifecycle}</strong></div>;
                  })()}

                  {status === 1 && (
                    <button
                      type="button"
                      className={styles.positionButton}
                      disabled={busy}
                      onClick={() =>
                        handleRequestWithdrawal(
                          position.id,
                        )
                      }
                    >
                      Request Withdrawal
                    </button>
                  )}

                  {status === 2 && (
                    <div className={styles.pendingNotice}>
                      <Clock3 size={15} />
                      Withdrawal requested
                    </div>
                  )}

                  {status === 3 && (
                    <button
                      type="button"
                      className={`${styles.positionButton} ${styles.claimButton}`}
                      disabled={
                        busy ||
                        withdrawalsPaused === true
                      }
                      onClick={() =>
                        handleWithdraw(position.id)
                      }
                    >
                      <ArrowDownToLine size={16} />
                      Claim {asset.symbol}
                    </button>
                  )}

                  {status === 4 && (
                    <div className={styles.completedNotice}>
                      <CheckCircle2 size={15} />
                      Position completed
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}

      <section className={styles.bottomBanner}>
        <div>
          <span className={styles.bottomIcon}>
            <ArrowUpRight size={20} />
          </span>

          <div>
            <strong>
              Capital should never sit still.
            </strong>

            <span>
              Build your Unlimited X position on
              BNB Chain.
            </span>
          </div>
        </div>

        <span className={styles.liveBottom}>
          <i />
          EARN LIVE
        </span>
      </section>
    </div>
  );
}