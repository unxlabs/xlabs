import { useEffect, useMemo, useState } from "react";

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



import {

  formatUnits,

  parseEther,

  parseUnits,

  type Address,

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
import { getMyPositions, type IndexedPosition } from "../../../shared/api/positions";
import { getLifecycleLabel } from "../../../shared/positions/lifecycle";




import {

  BNB_POOL_ID,

  BNB_STAKING_CONTRACT,

  BTC_POOL_ID,

  BTC_STAKING_CONTRACT,

  BTCB_TOKEN,

  USDT_POOL_ID,

  USDT_STAKING_CONTRACT,

  USDT_TOKEN,

  bnbStakingAbi,

  erc20Abi,

  tokenStakingAbi,

} from "../staking/stakingContracts";



/* =========================================================

   TYPES

   \========================================================= */



type Asset = "BNB" | "BTC" | "USDT";



type Position = {

  id: bigint;

  poolId: bigint;

  user: Address;

  principal: bigint;

  fundedForWithdrawal: bigint;

  createdAt: bigint;

  lockStartedAt: bigint;

  lockEndsAt: bigint;

  unlockRequestedAt: bigint;

  claimableAt: bigint;

  withdrawnAt: bigint;

  status: number;

};



/* =========================================================

   CONSTANTS

   \========================================================= */



const POSITION_STATUS: Record<number, string> = {

  0: "None",

  1: "Active",

  2: "Unlock Requested",

  3: "Claimable",

  4: "Withdrawn",

};



const ASSET_CONFIG = {

  BNB: {

    symbol: "BNB",

    displayName: "BNB",

    poolLabel: "BNB Chain",

    contract: BNB_STAKING_CONTRACT,

    token: null,

    poolId: BNB_POOL_ID,

    decimals: 18,

    contractShort: "0x3b2A...12f6",

  },



  BTC: {

    symbol: "BTCB",

    displayName: "Bitcoin",

    poolLabel: "BTC Pool",

    contract: BTC_STAKING_CONTRACT,

    token: BTCB_TOKEN,

    poolId: BTC_POOL_ID,

    decimals: 18,

    contractShort: "0xd436...0978",

  },



  USDT: {

    symbol: "USDT",

    displayName: "USDT",

    poolLabel: "Stable Pool",

    contract: USDT_STAKING_CONTRACT,

    token: USDT_TOKEN,

    poolId: USDT_POOL_ID,

    decimals: 18,

    contractShort: "0xa381...013d",

  },

} as const;



/* =========================================================

   FORMAT HELPERS

   \========================================================= */



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



function formatInputAmount(

  value: bigint,

  decimals: number,

) {

  const raw = formatUnits(value, decimals);



  const [whole, decimal = ""] = raw.split(".");



  const trimmed = decimal

    .slice(0, 8)

    .replace(/0+$/, "");



  return trimmed ? `${whole}.${trimmed}` : whole;

}



/* =========================================================

   PAGE

   \========================================================= */



export default function Stake() {

  const { address, isConnected } = useAccount();



  const chainId = useChainId();



  const { switchChainAsync } = useSwitchChain();



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




  const [selectedAsset, setSelectedAsset] =

    useState<Asset>("BNB");



  const asset = ASSET_CONFIG[selectedAsset];



  const isBNB = selectedAsset === "BNB";



  /* =======================================================

     WALLET BALANCE

     \======================================================= */



  const {

    data: walletBalance,

    refetch: refetchBalance,

  } = useBalance({

    address,

    chainId: bsc.id,



    ...(asset.token

      ? {

          token: asset.token,

        }

      : {}),



    query: {

      enabled: Boolean(address),

    },

  });



  /* =======================================================

     WRITE CONTRACT

     \======================================================= */



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

     PROTOCOL READS

     \======================================================= */



  const selectedAbi = isBNB

    ? bnbStakingAbi

    : tokenStakingAbi;



  const {

    data: totalDeposited,

    refetch: refetchTotalDeposited,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

    functionName: "totalDeposited",

    chainId: bsc.id,

  });



  const {

    data: activePrincipal,

    refetch: refetchActivePrincipal,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

    functionName: "activePrincipal",

    chainId: bsc.id,

  });



  const {

    data: totalWithdrawn,

    refetch: refetchTotalWithdrawn,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

    functionName: "totalWithdrawn",

    chainId: bsc.id,

  });



  const {

    data: uniqueStakers,

    refetch: refetchUniqueStakers,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

    functionName: "uniqueStakers",

    chainId: bsc.id,

  });



  const {

    data: depositsPaused,

    refetch: refetchDepositsPaused,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

    functionName: "depositsPaused",

    chainId: bsc.id,

  });



  /* =======================================================

     USER STATS

     \======================================================= */



  const {

    data: userStats,

    refetch: refetchUserStats,

  } = useReadContract({

    address: asset.contract,

    abi: selectedAbi,

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

    address: asset.contract,

    abi: selectedAbi,

    functionName: "getUserPositionIds",

    args: address ? [address] : undefined,

    chainId: bsc.id,



    query: {

      enabled: Boolean(address),

    },

  });



  /* =======================================================

     TOKEN ALLOWANCE

     \======================================================= */



  const {

    data: tokenAllowance,

    refetch: refetchAllowance,

  } = useReadContract({

    address:

      asset.token ??

      USDT_TOKEN,



    abi: erc20Abi,



    functionName: "allowance",



    args:

      !isBNB && address

        ? [

            address,

            asset.contract,

          ]

        : undefined,



    chainId: bsc.id,



    query: {

      enabled:

        !isBNB &&

        Boolean(address),

    },

  });



  /* =======================================================

     POSITIONS

     \======================================================= */



  const positionContracts = useMemo(() => {

    if (!positionIds) return [];



    return positionIds.map((positionId) => ({

      address: asset.contract,

      abi: selectedAbi,

      functionName: "getPosition" as const,

      args: [positionId] as const,

      chainId: bsc.id,

    }));

  }, [

    positionIds,

    asset.contract,

    selectedAbi,

  ]);



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

     \======================================================= */



  const userDeposited =

    userStats?.[0] ?? 0n;



  const userWithdrawn =

    userStats?.[1] ?? 0n;



  const userActive =

    userStats?.[2] ?? 0n;



  const userPositionCount =

    userStats?.[3] ?? 0n;



  const busy =

    isWriting ||

    isConfirming;



  /* =======================================================

     PARSED AMOUNT

     \======================================================= */



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

  }, [

    amount,

    asset.decimals,

  ]);



  const needsApproval =

    !isBNB &&

    parsedAmount > 0n &&

    (tokenAllowance ?? 0n) <

      parsedAmount;



  /* =======================================================

     NETWORK

     \======================================================= */



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

     \======================================================= */



  async function refreshData() {

    await Promise.all([

      refetchBalance(),

      refetchTotalDeposited(),

      refetchActivePrincipal(),

      refetchTotalWithdrawn(),

      refetchUniqueStakers(),

      refetchDepositsPaused(),

      refetchUserStats(),

      refetchPositionIds(),

      refetchPositions(),



      !isBNB

        ? refetchAllowance()

        : Promise.resolve(),

      refreshIndexedPositions(),
    ]);

  }



  /* =======================================================

     PERCENTAGE BUTTONS

     \======================================================= */



  function setPercentage(percent: number) {

    if (!walletBalance?.value) {

      setAmount("");

      return;

    }



    const balance =

      walletBalance.value;



    /*

      Native BNB needs a small gas reserve.



      BTCB and USDT do not need a token

      reserve because gas is paid in BNB.

    */



    if (

      percent === 100 &&

      isBNB

    ) {

      const gasReserve =

        parseEther("0.0005");



      const usable =

        balance > gasReserve

          ? balance - gasReserve

          : 0n;



      setAmount(

        formatInputAmount(

          usable,

          asset.decimals,

        ),

      );



      return;

    }



    const selected =

      (balance * BigInt(percent)) /

      100n;



    setAmount(

      formatInputAmount(

        selected,

        asset.decimals,

      ),

    );

  }



  /* =======================================================

     APPROVE TOKEN

     \======================================================= */



  async function handleApprove() {

    setMessage("");



    if (

      !isConnected ||

      !address

    ) {

      setMessage(

        "Connect your wallet first.",

      );



      return;

    }



    if (

      isBNB ||

      !asset.token

    ) {

      return;

    }



    if (parsedAmount <= 0n) {

      setMessage(

        `Enter the amount of ${asset.symbol} you want to stake.`,

      );



      return;

    }



    if (

      walletBalance?.value !==

        undefined &&

      parsedAmount >

        walletBalance.value

    ) {

      setMessage(

        `Insufficient ${asset.symbol} balance.`,

      );



      return;

    }



    const ready =

      await ensureBsc();



    if (!ready) return;



    try {

      setMessage(

        `Approve ${asset.symbol} in your wallet.`,

      );



      /*

        Exact approval:

        only approve the amount the user

        currently wants to stake.

      */



      await writeContractAsync({

        address: asset.token,

        abi: erc20Abi,

        functionName: "approve",

        args: [

          asset.contract,

          parsedAmount,

        ],

        chainId: bsc.id,

      });

    } catch {

      // handled by writeError

    }

  }



  /* =======================================================

     STAKE

     \======================================================= */



  async function handleStake() {

    setMessage("");



    if (

      !isConnected ||

      !address

    ) {

      setMessage(

        "Connect your wallet first.",

      );



      return;

    }



    if (!amount.trim()) {

      setMessage(

        `Enter the amount of ${asset.symbol} you want to stake.`,

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

        `Stake amount must be greater than 0 ${asset.symbol}.`,

      );



      return;

    }



    if (

      walletBalance?.value !==

        undefined &&

      value >

        walletBalance.value

    ) {

      setMessage(

        `Insufficient ${asset.symbol} balance.`,

      );



      return;

    }



    if (

      isBNB &&

      walletBalance?.value !==

        undefined &&

      value >= walletBalance.value

    ) {

      setMessage(

        "Leave a small amount of BNB in your wallet for gas.",

      );



      return;

    }



    const ready =

      await ensureBsc();



    if (!ready) return;



    /*

      ERC-20 assets need approval first.

    */



    if (

      !isBNB &&

      (tokenAllowance ?? 0n) <

        value

    ) {

      await handleApprove();

      return;

    }



    try {

      setMessage(

        "Confirm the staking transaction in your wallet.",

      );



      if (isBNB) {

        await writeContractAsync({

          address:

            BNB_STAKING_CONTRACT,



          abi: bnbStakingAbi,



          functionName: "stake",



          args: [

            BNB_POOL_ID,

          ],



          value,



          chainId: bsc.id,

        });



        return;

      }



      await writeContractAsync({

        address: asset.contract,



        abi: tokenStakingAbi,



        functionName: "stake",



        args: [

          asset.poolId,

          value,

        ],



        chainId: bsc.id,

      });

    } catch {

      // handled by writeError

    }

  }



  /* =======================================================

     REQUEST UNLOCK

     \======================================================= */



  async function handleUnlock(

    positionId: bigint,

  ) {

    setMessage("");



    if (!isConnected) {

      setMessage(

        "Connect your wallet first.",

      );



      return;

    }



    const ready =

      await ensureBsc();



    if (!ready) return;



    try {

      setMessage(

        "Confirm the unlock request in your wallet.",

      );



      if (isBNB) {

        await writeContractAsync({

          address: asset.contract,



          abi: bnbStakingAbi,



          functionName:

            "requestUnlock",



          args: [positionId],



          chainId: bsc.id,

        });



        return;

      }



      await writeContractAsync({

        address: asset.contract,



        abi: tokenStakingAbi,



        functionName:

          "requestUnlock",



        args: [positionId],



        chainId: bsc.id,

      });

    } catch {

      // handled by writeError

    }

  }



  /* =======================================================

     WITHDRAW

     \======================================================= */



  async function handleWithdraw(

    positionId: bigint,

  ) {

    setMessage("");



    if (!isConnected) {

      setMessage(

        "Connect your wallet first.",

      );



      return;

    }



    const ready =

      await ensureBsc();



    if (!ready) return;



    try {

      setMessage(

        "Confirm the withdrawal in your wallet.",

      );



      if (isBNB) {

        await writeContractAsync({

          address: asset.contract,



          abi: bnbStakingAbi,



          functionName:

            "withdraw",



          args: [positionId],



          chainId: bsc.id,

        });



        return;

      }



      await writeContractAsync({

        address: asset.contract,



        abi: tokenStakingAbi,



        functionName:

          "withdraw",



        args: [positionId],



        chainId: bsc.id,

      });

    } catch {

      // handled by writeError

    }

  }



  /* =======================================================

     TX CONFIRMED

     \======================================================= */



  useEffect(() => {

    if (!txConfirmed) return;



    setMessage(

      "Transaction confirmed successfully.",

    );



    void refreshData();

  }, [txConfirmed]);



  /* =======================================================

     WRITE ERROR

     \======================================================= */



  useEffect(() => {

    if (!writeError) return;



    const rejected =

      writeError.message.includes(

        "User rejected",

      ) ||

      writeError.message.includes(

        "User denied",

      );



    setMessage(

      rejected

        ? "Transaction cancelled."

        : "Transaction failed. Please check your wallet and try again.",

    );

  }, [writeError]);



  /* =======================================================

     ASSET CHANGE

     \======================================================= */



  useEffect(() => {

    setAmount("");

    setMessage("");

  }, [selectedAsset]);



  /* =======================================================

     BUTTON LABEL

     \======================================================= */



  function getStakeButtonLabel() {

    if (depositsPaused) {

      return "Staking Paused";

    }



    if (isWriting) {

      return "Confirm in Wallet...";

    }



    if (isConfirming) {

      return "Confirming...";

    }



    if (!isConnected) {

      return "Connect Wallet to Stake";

    }



    if (needsApproval) {

      return `Approve ${asset.symbol}`;

    }



    return `Stake ${asset.symbol}`;

  }



  /* =======================================================

     UI

     \======================================================= */



  return (

    <div className={styles.page}>

      {/* HERO */}



      <section className={styles.hero}>

        <div>

          <div className={styles.eyebrow}>

            <Sparkles size={14} />

            UNLIMITED X STAKING

          </div>



          <h1>Stake & Earn</h1>



          <p>

            Build your position with a simple,

            flexible staking experience.

          </p>

        </div>



        <div className={styles.chainBadge}>

          <span />

          BNB Chain

        </div>

      </section>



      {/* ASSET SELECTOR */}



      <section className={styles.assetSelector}>

        <button

          type="button"

          className={`${styles.assetTab} ${

            selectedAsset === "BNB"

              ? styles.assetTabActive

              : ""

          }`}

          onClick={() =>

            setSelectedAsset("BNB")

          }

        >

          <div

            className={`${styles.assetLogo} ${styles.bnbLogo}`}

          >

            BNB

          </div>



          <div className={styles.assetText}>

            <strong>BNB</strong>

            <span>BNB Chain</span>

          </div>



          <span className={styles.livePill}>

            LIVE

          </span>

        </button>



        <button

          type="button"

          className={`${styles.assetTab} ${

            selectedAsset === "BTC"

              ? styles.assetTabActive

              : ""

          }`}

          onClick={() =>

            setSelectedAsset("BTC")

          }

        >

          <div

            className={`${styles.assetLogo} ${styles.btcLogo}`}

          >

            ₿

          </div>



          <div className={styles.assetText}>

            <strong>Bitcoin</strong>

            <span>BTCB Pool</span>

          </div>



          <span className={styles.livePill}>

            LIVE

          </span>

        </button>



        <button

          type="button"

          className={`${styles.assetTab} ${

            selectedAsset === "USDT"

              ? styles.assetTabActive

              : ""

          }`}

          onClick={() =>

            setSelectedAsset("USDT")

          }

        >

          <div

            className={`${styles.assetLogo} ${styles.usdtLogo}`}

          >

            $

          </div>



          <div className={styles.assetText}>

            <strong>USDT</strong>

            <span>Stable Pool</span>

          </div>



          <span className={styles.livePill}>

            LIVE

          </span>

        </button>

      </section>



      {/* MAIN */}



      <div className={styles.mainGrid}>

<section

  className={`${styles.stakeCard} ${

    selectedAsset === "BTC"

      ? styles.stakeCardBtc

      : selectedAsset === "USDT"

        ? styles.stakeCardUsdt

        : styles.stakeCardBnb

  }`}

>          <div className={styles.cardHeader}>

            <div>

              <span

                className={styles.smallLabel}

              >

                STAKE {asset.symbol}

              </span>



              <h2>Enter amount</h2>

            </div>



            <div

              className={

                styles.walletBalance

              }

            >

              <Wallet size={15} />



              <div>

                <span>

                  Wallet balance

                </span>



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



          {/* AMOUNT */}



          <div className={styles.amountBox}>

            <input

              type="number"

              inputMode="decimal"

              min="0"

              step="any"

              placeholder="0.00"

              value={amount}

              onChange={(event) =>

                setAmount(

                  event.target.value,

                )

              }

            />



            <div

              className={

                styles.amountAsset

              }

            >

           <span

  className={`${styles.miniBnb} ${

    selectedAsset === "BTC"

      ? styles.miniBtc

      : selectedAsset === "USDT"

        ? styles.miniUsdt

        : ""

  }`}

>

                {selectedAsset === "BTC"

                  ? "₿"

                  : selectedAsset ===

                      "USDT"

                    ? "$"

                    : "BNB"}

              </span>



              {asset.symbol}

            </div>

          </div>



          {/* PERCENTAGES */}



          <div

            className={

              styles.percentageRow

            }

          >

            {[25, 50, 75, 100].map(

              (percent) => (

                <button

                  key={percent}

                  type="button"

                  onClick={() =>

                    setPercentage(

                      percent,

                    )

                  }

                  disabled={

                    !isConnected

                  }

                >

                  {percent === 100

                    ? "MAX"

                    : `${percent}%`}

                </button>

              ),

            )}

          </div>



          {/* RULES */}



          <div className={styles.rules}>

            <div>

              <ShieldCheck

                size={17}

              />



              <span>

                <strong>

                  No minimum

                </strong>

                Any amount above 0

              </span>

            </div>



            <div>

              <Layers3 size={17} />



              <span>

                <strong>

                  No maximum

                </strong>

                Flexible position size

              </span>

            </div>



            <div>

              <Clock3 size={17} />



              <span>

                <strong>

                  Flexible unlock

                </strong>

                No fixed lock period

              </span>

            </div>

          </div>



          {/* STAKE / APPROVE */}
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <button
                  className={styles.stakeButton}
                  type="button"
                  onClick={openConnectModal}
                  disabled={!mounted}
                >
                  Connect Wallet to Stake
                  <ChevronRight size={19} />
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <button
              className={styles.stakeButton}
              type="button"
              onClick={
                needsApproval
                  ? handleApprove
                  : handleStake
              }
              disabled={
                busy ||
                depositsPaused === true
              }
            >
              {getStakeButtonLabel()}

              {!busy && (
                <ChevronRight size={19} />
              )}
            </button>
          )}



          {/* TOKEN APPROVAL INFO */}



          {!isBNB &&

            isConnected &&

            needsApproval && (

              <div

                className={

                  styles.message

                }

              >

                First approve{" "}

                {asset.symbol}. After

                confirmation, press Stake{" "}

                {asset.symbol}.

              </div>

            )}



          {/* MESSAGE */}



          {message && (

            <div

              className={`${styles.message} ${

                txConfirmed

                  ? styles.messageSuccess

                  : ""

              }`}

            >

              {message}

            </div>

          )}



          {/* CONTRACT */}



          <div

            className={

              styles.contractLine

            }

          >

            <span>

              Smart Contract

            </span>



            <code>

              {asset.contractShort}

            </code>

          </div>

        </section>



        {/* USER POSITION */}



        <aside

          className={

            styles.sidePanel

          }

        >

          <div

            className={

              styles.sidePanelTop

            }

          >

            <span

              className={

                styles.smallLabel

              }

            >

              YOUR POSITION

            </span>



            <button

              type="button"

              onClick={() =>

                void refreshData()

              }

              className={

                styles.iconButton

              }

              aria-label="Refresh"

            >

              <RefreshCw

                size={16}

              />

            </button>

          </div>



          <div

            className={

              styles.bigPosition

            }

          >

            <span>

              Active {asset.symbol}

            </span>



            <strong>

              {formatAssetAmount(

                userActive,

                asset.decimals,

              )}{" "}

              {asset.symbol}

            </strong>



            <small>

              {userPositionCount.toString()}{" "}

              position

              {userPositionCount ===

              1n

                ? ""

                : "s"}

            </small>

          </div>



          <div

            className={

              styles.positionStats

            }

          >

            <div>

              <span>

                Total deposited

              </span>



              <strong>

                {formatAssetAmount(

                  userDeposited,

                  asset.decimals,

                )}{" "}

                {asset.symbol}

              </strong>

            </div>



            <div>

              <span>

                Withdrawn

              </span>



              <strong>

                {formatAssetAmount(

                  userWithdrawn,

                  asset.decimals,

                )}{" "}

                {asset.symbol}

              </strong>

            </div>

          </div>



          {!isConnected && (

            <div

              className={

                styles.sideNotice

              }

            >

              <Wallet size={18} />



              Connect your wallet to

              see your staking

              positions.

            </div>

          )}

        </aside>

      </div>



      {/* PROTOCOL STATS */}



      <section

        className={

          styles.protocolStrip

        }

      >

        <div>

          <Coins size={17} />



          <span>

            Total Staked



            <strong>

              {formatAssetAmount(

                totalDeposited,

                asset.decimals,

              )}{" "}

              {asset.symbol}

            </strong>

          </span>

        </div>



        <div>

          <Layers3 size={17} />



          <span>

            Active Principal



            <strong>

              {formatAssetAmount(

                activePrincipal,

                asset.decimals,

              )}{" "}

              {asset.symbol}

            </strong>

          </span>

        </div>



        <div>

          <Users size={17} />



          <span>

            Stakers



            <strong>

              {uniqueStakers?.toString() ??

                "0"}

            </strong>

          </span>

        </div>



        <div>

          <ArrowDownToLine

            size={17}

          />



          <span>

            Withdrawn



            <strong>

              {formatAssetAmount(

                totalWithdrawn,

                asset.decimals,

              )}{" "}

              {asset.symbol}

            </strong>

          </span>

        </div>

      </section>



      {/* POSITIONS */}



      {isConnected && (

          <section

            className={

              styles.positionsSection

            }

          >

            <div

              className={

                styles.positionsHeader

              }

            >

              <div>

                <span

                  className={

                    styles.smallLabel

                  }

                >

                  ON-CHAIN POSITIONS

                </span>



                <h2>

                  Your {asset.symbol}{" "}

                  Positions

                </h2>

              </div>



              <button

                type="button"

                className={

                  styles.refreshTextButton

                }

                onClick={() =>

                  void refreshData()

                }

              >

                <RefreshCw

                  size={14}

                />



                Refresh

              </button>

            </div>

            <div className={styles.indexerBar}>
              <span>Indexer connected</span>
              <span>{indexedPositions.filter((item) => item.productType === "stake" && item.contractAddress.toLowerCase() === asset.contract.toLowerCase()).length} indexed</span>
              <span>{indexerUpdatedAt ? `Synced ${new Date(indexerUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "Syncing…"}</span>
            </div>

            <div

              className={

                styles.positionsGrid

              }

            >

              {positions.length === 0 && (
                <div className={styles.emptyPositions}>
                  <strong>No {asset.symbol} positions for this wallet yet.</strong>
                  <span>The indexer is connected and will show new positions here after they are indexed.</span>
                </div>
              )}

              {positions.map(

                (position) => {

                  if (!position) {

                    return null;

                  }



                  const status =

                    Number(

                      position.status,

                    );



                  return (

                    <article

                      key={position.id.toString()}

                      className={

                        styles.positionCard

                      }

                    >

                      <div

                        className={

                          styles.positionCardTop

                        }

                      >

                        <div>

                          <span>

                            POSITION

                          </span>



                          <strong>

                            #

                            {position.id.toString()}

                          </strong>

                        </div>



                        <div

                          className={`${styles.status} ${

                            status === 3

                              ? styles.claimableStatus

                              : ""

                          }`}

                        >

                          {POSITION_STATUS[

                            status

                          ] ??

                            "Unknown"}

                        </div>

                      </div>



                      <div

                        className={

                          styles.positionAmount

                        }

                      >

                        <span>

                          Principal

                        </span>



                        <strong>

                          {formatAssetAmount(

                            position.principal,

                            asset.decimals,

                            6,

                          )}{" "}

                          {asset.symbol}

                        </strong>

                      </div>



                      <div

                        className={

                          styles.positionMeta

                        }

                      >

                        <div>

                          <span>

                            Pool

                          </span>



                          <strong>

                            #

                            {position.poolId.toString()}

                          </strong>

                        </div>



                        <div>

                          <span>

                            Ready for

                            withdrawal

                          </span>



                          <strong>

                            {formatAssetAmount(

                              position.fundedForWithdrawal,

                              asset.decimals,

                              6,

                            )}{" "}

                            {asset.symbol}

                          </strong>

                        </div>

                      </div>



                      {(() => {
                        const indexed = indexedPositions.find((item) =>
                          item.productType === "stake" &&
                          item.contractAddress.toLowerCase() === asset.contract.toLowerCase() &&
                          item.positionId === Number(position.id),
                        );
                        if (!indexed) return null;
                        const lifecycle = getLifecycleLabel(indexed);
                        return <div className={styles.lifecycleLine}><span>Lifecycle</span><strong>{lifecycle}</strong></div>;
                      })()}

                      {status === 1 && (

                        <button

                          type="button"

                          className={

                            styles.positionButton

                          }

                          disabled={

                            busy

                          }

                          onClick={() =>

                            handleUnlock(

                              position.id,

                            )

                          }

                        >

                          Request Unlock

                        </button>

                      )}



                      {status === 2 && (

                        <div

                          className={

                            styles.pendingNotice

                          }

                        >

                          <Clock3

                            size={15}

                          />

                          Unlock requested

                        </div>

                      )}



                      {status === 3 && (

                        <button

                          type="button"

                          className={`${styles.positionButton} ${styles.withdrawButton}`}

                          disabled={

                            busy

                          }

                          onClick={() =>

                            handleWithdraw(

                              position.id,

                            )

                          }

                        >

                          Withdraw{" "}

                          {asset.symbol}

                        </button>

                      )}



                      {status === 4 && (

                        <div

                          className={

                            styles.completedNotice

                          }

                        >

                          Position

                          completed

                        </div>

                      )}

                    </article>

                  );

                },

              )}

            </div>

          </section>

        )}

    </div>

  );

}
