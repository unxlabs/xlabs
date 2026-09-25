import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits } from "viem";
import { bsc } from "wagmi/chains";

import {
  GENESIS_ABI,
  GENESIS_CONTRACT,
  USDT_ABI,
  USDT_CONTRACT,
  getGenesisTier,
} from "@/features/app/genesis/genesisContract";

import styles from "./Genesis.module.css";

export default function Genesis() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: price,
    refetch: refetchPrice,
  } = useReadContract({
    address: GENESIS_CONTRACT,
    abi: GENESIS_ABI,
    functionName: "PRICE",
    chainId: bsc.id,
  });

  const {
    data: maxSupply,
  } = useReadContract({
    address: GENESIS_CONTRACT,
    abi: GENESIS_ABI,
    functionName: "MAX_SUPPLY",
    chainId: bsc.id,
  });

  const {
    data: remainingSupply,
    refetch: refetchRemaining,
  } = useReadContract({
    address: GENESIS_CONTRACT,
    abi: GENESIS_ABI,
    functionName: "remainingSupply",
    chainId: bsc.id,
  });

  const {
    data: passBalance,
    refetch: refetchPassBalance,
  } = useReadContract({
    address: GENESIS_CONTRACT,
    abi: GENESIS_ABI,
    functionName: "passesOf",
    args: address ? [address] : undefined,
    chainId: bsc.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const totalCost = useMemo(() => {
    if (price === undefined) return 0n;

    return price * BigInt(quantity);
  }, [price, quantity]);

  const {
    data: allowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: USDT_CONTRACT,
    abi: USDT_ABI,
    functionName: "allowance",
    args: address ? [address, GENESIS_CONTRACT] : undefined,
    chainId: bsc.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePromptPending,
    error: approveError,
  } = useWriteContract();

  const {
    data: mintHash,
    writeContract: writeMint,
    isPending: isMintPromptPending,
    error: mintError,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: approveConfirmed,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
    chainId: bsc.id,
  });

  const {
    isLoading: isMintConfirming,
    isSuccess: mintConfirmed,
  } = useWaitForTransactionReceipt({
    hash: mintHash,
    chainId: bsc.id,
  });

  useEffect(() => {
    if (!approveConfirmed) return;

    void refetchAllowance();
  }, [approveConfirmed, refetchAllowance]);

  useEffect(() => {
    if (!mintConfirmed) return;

    void refetchAllowance();
    void refetchPassBalance();
    void refetchRemaining();
    void refetchPrice();
  }, [
    mintConfirmed,
    refetchAllowance,
    refetchPassBalance,
    refetchRemaining,
    refetchPrice,
  ]);

  useEffect(() => {
    const message =
      approveError?.message ||
      mintError?.message ||
      "";

    setErrorMessage(message);
  }, [approveError, mintError]);

  const balance = passBalance ?? 0n;
  const tier = getGenesisTier(balance);

  const needsApproval =
    allowance !== undefined &&
    totalCost > 0n &&
    allowance < totalCost;

  const sold =
    maxSupply !== undefined && remainingSupply !== undefined
      ? maxSupply - remainingSupply
      : undefined;

  const priceText =
    price !== undefined ? formatUnits(price, 18) : "—";

  const totalText =
    price !== undefined ? formatUnits(totalCost, 18) : "—";

  const increase = () => {
    if (
      remainingSupply !== undefined &&
      BigInt(quantity) >= remainingSupply
    ) {
      return;
    }

    setQuantity((value) => value + 1);
  };

  const decrease = () => {
    setQuantity((value) => Math.max(1, value - 1));
  };

  const approve = () => {
    if (!address || totalCost <= 0n) return;

    setErrorMessage("");

    writeApprove({
      address: USDT_CONTRACT,
      abi: USDT_ABI,
      functionName: "approve",
      args: [GENESIS_CONTRACT, totalCost],
      chainId: bsc.id,
    });
  };

  const mint = () => {
    if (!address || quantity <= 0) return;

    setErrorMessage("");

    writeMint({
      address: GENESIS_CONTRACT,
      abi: GENESIS_ABI,
      functionName: "mint",
      args: [BigInt(quantity)],
      chainId: bsc.id,
    });
  };

  const actionButton = () => {
    if (!isConnected) {
      return (
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              className={styles.primaryButton}
              type="button"
              disabled={!mounted}
              onClick={openConnectModal}
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      );
    }

    if (chainId !== bsc.id) {
      return (
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => switchChain({ chainId: bsc.id })}
        >
          Switch to BNB Chain
        </button>
      );
    }

    if (allowance === undefined) {
      return (
        <button
          className={styles.primaryButton}
          type="button"
          disabled
        >
          Loading...
        </button>
      );
    }

    if (needsApproval) {
      return (
        <button
          className={styles.primaryButton}
          type="button"
          disabled={
            isApprovePromptPending ||
            isApproveConfirming ||
            totalCost === 0n
          }
          onClick={approve}
        >
          {isApprovePromptPending
            ? "Confirm approval..."
            : isApproveConfirming
              ? "Approving USDT..."
              : `Approve ${totalText} USDT`}
        </button>
      );
    }

    return (
      <button
        className={styles.primaryButton}
        type="button"
        disabled={
          isMintPromptPending ||
          isMintConfirming ||
          totalCost === 0n ||
          remainingSupply === 0n
        }
        onClick={mint}
      >
        {isMintPromptPending
          ? "Confirm mint..."
          : isMintConfirming
            ? "Minting..."
            : `Mint ${quantity} Genesis Pass${quantity > 1 ? "es" : ""}`}
      </button>
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <div className={styles.eyebrow}>
            UNLIMITED X LABS
          </div>

          <h1>Genesis Pass</h1>

          <p className={styles.subtitle}>
            The Genesis membership pass of the Unlimited X Labs ecosystem.
            Unlock XP boosts, referral boosts, exclusive campaigns and
            ecosystem privileges.
          </p>

          <div className={styles.stats}>
            <div>
              <span>Price</span>
              <strong>{priceText} USDT</strong>
            </div>

            <div>
              <span>Minted</span>
              <strong>
                {sold !== undefined ? sold.toString() : "—"} /{" "}
                {maxSupply !== undefined
                  ? maxSupply.toString()
                  : "10,000"}
              </strong>
            </div>

            <div>
              <span>Remaining</span>
              <strong>
                {remainingSupply !== undefined
                  ? remainingSupply.toString()
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        <div className={styles.nftWrap}>
          <img
            className={styles.nft}
            src="/nft/unlimited-genesis-pass.png"
            alt="Unlimited Genesis Pass"
          />
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.mintCard}>
          <div className={styles.cardTitle}>
            Mint Genesis Pass
          </div>

          <div className={styles.quantityLabel}>
            Quantity
          </div>

          <div className={styles.quantity}>
            <button
              type="button"
              onClick={decrease}
              aria-label="Decrease quantity"
            >
              −
            </button>

            <strong>{quantity}</strong>

            <button
              type="button"
              onClick={increase}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className={styles.summary}>
            <div>
              <span>Price per Pass</span>
              <strong>{priceText} USDT</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>{totalText} USDT</strong>
            </div>

            <div>
              <span>Network</span>
              <strong>BNB Chain</strong>
            </div>
          </div>

          {actionButton()}

          {approveConfirmed &&
          needsApproval === false &&
          !mintConfirmed ? (
            <div className={styles.success}>
              USDT approved. You can now mint your Genesis Pass.
            </div>
          ) : null}

          {mintConfirmed ? (
            <div className={styles.success}>
              Genesis Pass minted successfully.
            </div>
          ) : null}

          {errorMessage ? (
            <div className={styles.error}>
              {errorMessage}
            </div>
          ) : null}

          <div className={styles.note}>
            Mint price is paid in USDT. BNB is required only for network gas.
          </div>
        </div>

        <div className={styles.memberCard}>
          <div className={styles.cardTitle}>
            Your Membership
          </div>

          {!isConnected ? (
            <div className={styles.empty}>
              Connect your wallet to view your Genesis membership.
            </div>
          ) : (
            <>
              <div className={styles.balanceNumber}>
                {balance.toString()}
              </div>

              <div className={styles.balanceLabel}>
                Genesis Passes
              </div>

              <div className={styles.tierBox}>
                <span>Current Tier</span>
                <strong>
                  {tier?.name ?? "Not Active"}
                </strong>
              </div>

              {tier ? (
                <div className={styles.boosts}>
                  <div>
                    <span>XP Boost</span>
                    <strong>{tier.xp}</strong>
                  </div>

                  <div>
                    <span>Referral XP</span>
                    <strong>{tier.referral}</strong>
                  </div>
                </div>
              ) : (
                <div className={styles.empty}>
                  Mint your first Genesis Pass to activate membership.
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className={styles.tiers}>
        <div className={styles.sectionHeading}>
          <span>MEMBERSHIP</span>
          <h2>Genesis Tiers</h2>
        </div>

        <div className={styles.tierGrid}>
          {[
            ["Genesis", "1–2", "+10%", "+5%"],
            ["Genesis+", "3–4", "+20%", "+10%"],
            ["Elite", "5–9", "+30%", "+15%"],
            ["Apex", "10–24", "+40%", "+20%"],
            ["Prime", "25–49", "+55%", "+25%"],
            ["Founder", "50+", "+75%", "+35%"],
          ].map(([name, passes, xp, referral]) => (
            <div
              className={`${styles.tier} ${
                tier?.name === name
                  ? styles.activeTier
                  : ""
              }`}
              key={name}
            >
              <strong>{name}</strong>

              <span>{passes} Passes</span>

              <div>
                XP <b>{xp}</b>
              </div>

              <div>
                Referral XP <b>{referral}</b>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}