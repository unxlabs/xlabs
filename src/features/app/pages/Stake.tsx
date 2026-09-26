import { useEffect, useMemo, useState } from "react";
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
import {
  formatEther,
  formatUnits,
  parseEther,
} from "viem";
import {
  ArrowDownToLine,
  ChevronRight,
  Clock3,
  Coins,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import styles from "./Stake.module.css";

import {
  BNB_POOL_ID,
  BNB_STAKING_CONTRACT,
  stakingAbi,
} from "../staking/stakingContracts";

const POSITION_STATUS: Record<number, string> = {
  0: "None",
  1: "Active",
  2: "Unlock Requested",
  3: "Claimable",
  4: "Withdrawn",
};

function formatBNB(value?: bigint, decimals = 4) {
  if (value === undefined) return "0";

  const number = Number(formatEther(value));

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

function formatInputBNB(value: bigint) {
  const raw = formatEther(value);
  const [whole, decimal = ""] = raw.split(".");
  const trimmed = decimal.slice(0, 8).replace(/0+$/, "");

  return trimmed ? `${whole}.${trimmed}` : whole;
}

export default function Stake() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<
    "BNB" | "BTC" | "USDT"
  >("BNB");

  const {
    data: walletBalance,
    refetch: refetchBalance,
  } = useBalance({
    address,
    chainId: bsc.id,
    query: {
      enabled: Boolean(address),
    },
  });

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

  const {
    data: totalDeposited,
    refetch: refetchTotalDeposited,
  } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "totalDeposited",
    chainId: bsc.id,
  });

  const {
    data: activePrincipal,
    refetch: refetchActivePrincipal,
  } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "activePrincipal",
    chainId: bsc.id,
  });

  const {
    data: totalWithdrawn,
    refetch: refetchTotalWithdrawn,
  } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "totalWithdrawn",
    chainId: bsc.id,
  });

  const {
    data: uniqueStakers,
    refetch: refetchUniqueStakers,
  } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "uniqueStakers",
    chainId: bsc.id,
  });

  const { data: depositsPaused } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "depositsPaused",
    chainId: bsc.id,
  });

  const {
    data: userStats,
    refetch: refetchUserStats,
  } = useReadContract({
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
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
    address: BNB_STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "getUserPositionIds",
    args: address ? [address] : undefined,
    chainId: bsc.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const positionContracts = useMemo(() => {
    if (!positionIds) return [];

    return positionIds.map((positionId) => ({
      address: BNB_STAKING_CONTRACT,
      abi: stakingAbi,
      functionName: "getPosition" as const,
      args: [positionId] as const,
      chainId: bsc.id,
    }));
  }, [positionIds]);

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
      .filter((item) => item.status === "success")
      .map((item) => item.result);
  }, [positionsData]);

  const userDeposited = userStats?.[0] ?? 0n;
  const userWithdrawn = userStats?.[1] ?? 0n;
  const userActive = userStats?.[2] ?? 0n;
  const userPositionCount = userStats?.[3] ?? 0n;

  const busy = isWriting || isConfirming;

  async function ensureBsc() {
    if (chainId === bsc.id) return true;

    try {
      await switchChainAsync({
        chainId: bsc.id,
      });

      return true;
    } catch {
      setMessage("Please switch your wallet to BNB Smart Chain.");
      return false;
    }
  }

  async function refreshData() {
    await Promise.all([
      refetchBalance(),
      refetchTotalDeposited(),
      refetchActivePrincipal(),
      refetchTotalWithdrawn(),
      refetchUniqueStakers(),
      refetchUserStats(),
      refetchPositionIds(),
      refetchPositions(),
    ]);
  }

  function setPercentage(percent: number) {
    if (!walletBalance?.value) {
      setAmount("");
      return;
    }

    const balance = walletBalance.value;

    /*
      MAX يترك احتياط صغير للغاز.
      هذا مجرد تقدير مريح وليس حساب Gas نهائي.
    */
    if (percent === 100) {
      const gasReserve = parseEther("0.0005");

      const usable =
        balance > gasReserve ? balance - gasReserve : 0n;

      setAmount(formatInputBNB(usable));
      return;
    }

    const selected = (balance * BigInt(percent)) / 100n;

    setAmount(formatInputBNB(selected));
  }

  async function handleStake() {
    setMessage("");

    if (!isConnected || !address) {
      setMessage("Connect your wallet first.");
      return;
    }

    if (selectedAsset !== "BNB") {
      setMessage(`${selectedAsset} staking is coming soon.`);
      return;
    }

    if (!amount.trim()) {
      setMessage("Enter the amount of BNB you want to stake.");
      return;
    }

    let value: bigint;

    try {
      value = parseEther(amount.trim());
    } catch {
      setMessage("Enter a valid BNB amount.");
      return;
    }

    if (value <= 0n) {
      setMessage("Stake amount must be greater than 0 BNB.");
      return;
    }

    if (
      walletBalance?.value !== undefined &&
      value >= walletBalance.value
    ) {
      setMessage("Leave a small amount of BNB in your wallet for gas.");
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage("Confirm the transaction in your wallet.");

      await writeContractAsync({
        address: BNB_STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "stake",
        args: [BNB_POOL_ID],
        value,
        chainId: bsc.id,
      });
    } catch {
      // Detailed error is handled by writeError.
    }
  }

  async function handleUnlock(positionId: bigint) {
    setMessage("");

    if (!isConnected) {
      setMessage("Connect your wallet first.");
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage("Confirm the unlock request in your wallet.");

      await writeContractAsync({
        address: BNB_STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "requestUnlock",
        args: [positionId],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  async function handleWithdraw(positionId: bigint) {
    setMessage("");

    if (!isConnected) {
      setMessage("Connect your wallet first.");
      return;
    }

    const ready = await ensureBsc();

    if (!ready) return;

    try {
      setMessage("Confirm the withdrawal in your wallet.");

      await writeContractAsync({
        address: BNB_STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "withdraw",
        args: [positionId],
        chainId: bsc.id,
      });
    } catch {
      // handled by writeError
    }
  }

  useEffect(() => {
    if (!txConfirmed) return;

    setAmount("");
    setMessage("Transaction confirmed successfully.");
    void refreshData();
  }, [txConfirmed]);

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

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} />
            UNLIMITED X STAKING
          </div>

          <h1>Stake & Earn</h1>

          <p>
            Build your position with a simple, flexible staking
            experience.
          </p>
        </div>

        <div className={styles.chainBadge}>
          <span />
          BNB Chain
        </div>
      </section>

      <section className={styles.assetSelector}>
        <button
          type="button"
          className={`${styles.assetTab} ${
            selectedAsset === "BNB" ? styles.assetTabActive : ""
          }`}
          onClick={() => setSelectedAsset("BNB")}
        >
          <div className={`${styles.assetLogo} ${styles.bnbLogo}`}>
            BNB
          </div>

          <div className={styles.assetText}>
            <strong>BNB</strong>
            <span>BNB Chain</span>
          </div>

          <span className={styles.livePill}>LIVE</span>
        </button>

        <button
          type="button"
          className={`${styles.assetTab} ${
            selectedAsset === "BTC" ? styles.assetTabActive : ""
          }`}
          onClick={() => setSelectedAsset("BTC")}
        >
          <div className={`${styles.assetLogo} ${styles.btcLogo}`}>
            ₿
          </div>

          <div className={styles.assetText}>
            <strong>Bitcoin</strong>
            <span>BTC Pool</span>
          </div>

          <span className={styles.soonPill}>SOON</span>
        </button>

        <button
          type="button"
          className={`${styles.assetTab} ${
            selectedAsset === "USDT" ? styles.assetTabActive : ""
          }`}
          onClick={() => setSelectedAsset("USDT")}
        >
          <div className={`${styles.assetLogo} ${styles.usdtLogo}`}>
            $
          </div>

          <div className={styles.assetText}>
            <strong>USDT</strong>
            <span>Stable Pool</span>
          </div>

          <span className={styles.soonPill}>SOON</span>
        </button>
      </section>

      {selectedAsset === "BNB" ? (
        <div className={styles.mainGrid}>
          <section className={styles.stakeCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.smallLabel}>
                  STAKE BNB
                </span>
                <h2>Enter amount</h2>
              </div>

              <div className={styles.walletBalance}>
                <Wallet size={15} />

                <div>
                  <span>Wallet balance</span>
                  <strong>
                    {isConnected
                      ? `${formatBNB(walletBalance?.value, 6)} BNB`
                      : "Not connected"}
                  </strong>
                </div>
              </div>
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
                <span className={styles.miniBnb}>BNB</span>
                BNB
              </div>
            </div>

            <div className={styles.percentageRow}>
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setPercentage(percent)}
                  disabled={!isConnected}
                >
                  {percent === 100 ? "MAX" : `${percent}%`}
                </button>
              ))}
            </div>

            <div className={styles.rules}>
              <div>
                <ShieldCheck size={17} />
                <span>
                  <strong>No minimum</strong>
                  Any amount above 0
                </span>
              </div>

              <div>
                <Layers3 size={17} />
                <span>
                  <strong>No maximum</strong>
                  Flexible position size
                </span>
              </div>

              <div>
                <Clock3 size={17} />
                <span>
                  <strong>Flexible unlock</strong>
                  No fixed lock period
                </span>
              </div>
            </div>

            <button
              className={styles.stakeButton}
              type="button"
              onClick={handleStake}
              disabled={busy || depositsPaused === true}
            >
              {depositsPaused
                ? "Staking Paused"
                : isWriting
                  ? "Confirm in Wallet..."
                  : isConfirming
                    ? "Confirming..."
                    : !isConnected
                      ? "Connect Wallet to Stake"
                      : "Stake BNB"}
              {!busy && <ChevronRight size={19} />}
            </button>

            {message && (
              <div
                className={`${styles.message} ${
                  txConfirmed ? styles.messageSuccess : ""
                }`}
              >
                {message}
              </div>
            )}

            <div className={styles.contractLine}>
              <span>Smart Contract</span>
              <code>0x3b2A...12f6</code>
            </div>
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelTop}>
              <span className={styles.smallLabel}>
                YOUR POSITION
              </span>

              <button
                type="button"
                onClick={() => void refreshData()}
                className={styles.iconButton}
                aria-label="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className={styles.bigPosition}>
              <span>Active BNB</span>
              <strong>{formatBNB(userActive)} BNB</strong>
              <small>
                {userPositionCount.toString()} position
                {userPositionCount === 1n ? "" : "s"}
              </small>
            </div>

            <div className={styles.positionStats}>
              <div>
                <span>Total deposited</span>
                <strong>{formatBNB(userDeposited)} BNB</strong>
              </div>

              <div>
                <span>Withdrawn</span>
                <strong>{formatBNB(userWithdrawn)} BNB</strong>
              </div>
            </div>

            {!isConnected && (
              <div className={styles.sideNotice}>
                <Wallet size={18} />
                Connect your wallet to see your staking
                positions.
              </div>
            )}
          </aside>
        </div>
      ) : (
        <section className={styles.comingSoonCard}>
          <div
            className={`${styles.comingIcon} ${
              selectedAsset === "BTC"
                ? styles.btcLogo
                : styles.usdtLogo
            }`}
          >
            {selectedAsset === "BTC" ? "₿" : "$"}
          </div>

          <span className={styles.smallLabel}>
            COMING SOON
          </span>

          <h2>
            {selectedAsset === "BTC"
              ? "Bitcoin Staking"
              : "USDT Staking"}
          </h2>

          <p>
            The interface is ready. This pool will become
            available after its smart contract is deployed and
            connected.
          </p>
        </section>
      )}

      <section className={styles.protocolStrip}>
        <div>
          <Coins size={17} />
          <span>
            Total Staked
            <strong>{formatBNB(totalDeposited)} BNB</strong>
          </span>
        </div>

        <div>
          <Layers3 size={17} />
          <span>
            Active Principal
            <strong>{formatBNB(activePrincipal)} BNB</strong>
          </span>
        </div>

        <div>
          <Users size={17} />
          <span>
            Stakers
            <strong>{uniqueStakers?.toString() ?? "0"}</strong>
          </span>
        </div>

        <div>
          <ArrowDownToLine size={17} />
          <span>
            Withdrawn
            <strong>{formatBNB(totalWithdrawn)} BNB</strong>
          </span>
        </div>
      </section>

      {isConnected &&
        selectedAsset === "BNB" &&
        positions.length > 0 && (
          <section className={styles.positionsSection}>
            <div className={styles.positionsHeader}>
              <div>
                <span className={styles.smallLabel}>
                  ON-CHAIN POSITIONS
                </span>
                <h2>Your BNB Positions</h2>
              </div>

              <button
                type="button"
                className={styles.refreshTextButton}
                onClick={() => void refreshData()}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
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
                        {POSITION_STATUS[status] ?? "Unknown"}
                      </div>
                    </div>

                    <div className={styles.positionAmount}>
                      <span>Principal</span>
                      <strong>
                        {formatBNB(position.principal, 6)} BNB
                      </strong>
                    </div>

                    <div className={styles.positionMeta}>
                      <div>
                        <span>Pool</span>
                        <strong>
                          #{position.poolId.toString()}
                        </strong>
                      </div>

                      <div>
                        <span>Ready for withdrawal</span>
                        <strong>
                          {formatBNB(
                            position.fundedForWithdrawal,
                            6,
                          )}{" "}
                          BNB
                        </strong>
                      </div>
                    </div>

                    {status === 1 && (
                      <button
                        type="button"
                        className={styles.positionButton}
                        disabled={busy}
                        onClick={() =>
                          handleUnlock(position.id)
                        }
                      >
                        Request Unlock
                      </button>
                    )}

                    {status === 2 && (
                      <div className={styles.pendingNotice}>
                        <Clock3 size={15} />
                        Unlock requested
                      </div>
                    )}

                    {status === 3 && (
                      <button
                        type="button"
                        className={`${styles.positionButton} ${styles.withdrawButton}`}
                        disabled={busy}
                        onClick={() =>
                          handleWithdraw(position.id)
                        }
                      >
                        Withdraw BNB
                      </button>
                    )}

                    {status === 4 && (
                      <div className={styles.completedNotice}>
                        Position completed
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
    </div>
  );
}