import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

export default function Deposit() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  const parsed = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amount]);

  function onDepositMock() {
    if (!isConnected) return toast.error("Please connect your wallet first.");
    if (!parsed) return toast.error("Enter a valid amount.");
    toast.success("Deposit placeholder — next step: approve BTCB + deposit contract.");
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 className="pageTitle">Deposit BTCB</h2>
      <p className="pageSub">
        This is the MVP deposit screen. Next we’ll connect it to the BTCB token and your deposit contract.
      </p>

      <div className="card cardGlow">
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Amount (BTCB)</span>
          <input
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            inputMode="decimal"
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={onDepositMock} style={{ width: "100%" }}>
            Deposit
          </button>
        </div>
      </div>
    </div>
  );
}
