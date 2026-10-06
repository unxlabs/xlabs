import { ArrowRight, Blocks, LockKeyhole, Network, Sparkles, Users, Video } from "lucide-react";
import styles from "./Tokenomics.module.css";

const allocations = [
  { name: "Community & Airdrops", pct: 25, amount: "250M", note: "Season-based participation and community distribution." },
  { name: "Ecosystem Rewards", pct: 20, amount: "200M", note: "Long-term incentives across products, campaigns and growth." },
  { name: "Partner Launch Pool", pct: 15, amount: "150M", note: "Campaign infrastructure and strategic ecosystem matching." },
  { name: "Creator Network", pct: 10, amount: "100M", note: "Performance-led creator growth and qualified acquisition." },
  { name: "Treasury", pct: 10, amount: "100M", note: "Long-term ecosystem operations and resilience." },
  { name: "Team & Contributors", pct: 10, amount: "100M", note: "Long-term alignment with a 12-month cliff." },
  { name: "Liquidity & Market Operations", pct: 7, amount: "70M", note: "Launch liquidity and responsible market operations." },
  { name: "Strategic Partners / Investors", pct: 3, amount: "30M", note: "Selective strategic alignment and ecosystem expansion." },
];

const pillars = [
  { icon: Users, title: "Users participate", text: "Verified activity builds reputation, eligibility and access across the ecosystem." },
  { icon: Video, title: "Creators activate", text: "Creator value is measured by qualified users and durable participation, not views alone." },
  { icon: Network, title: "Partners expand", text: "Projects can launch measurable campaigns into an existing participation network." },
  { icon: Blocks, title: "XLAP connects them", text: "One economic layer coordinates access, incentives and long-term ecosystem growth." },
];

const vesting = [
  ["Community & Airdrops", "2% of allocation at TGE", "Season-based releases over 48 months"],
  ["Ecosystem Rewards", "0% at TGE", "Progressive emissions over 60 months"],
  ["Partner Launch Pool", "0% at TGE", "Campaign-led releases over 60 months"],
  ["Creator Network", "0% at TGE", "Performance-based releases over 48 months"],
  ["Treasury", "0% at TGE", "12-month lock, then 48-month release"],
  ["Team & Contributors", "0% at TGE", "12-month cliff, then 36-month vesting"],
  ["Liquidity & Market Operations", "Up to 35% of allocation at TGE", "Remaining allocation released as required"],
  ["Strategic Partners / Investors", "Up to 5% of allocation at TGE", "6-month cliff, then 24-month vesting"],
];

export default function Tokenomics() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.kicker}><Sparkles size={15} /> THE PARTICIPATION ECONOMY</div>
        <h1>XLAP powers participation.</h1>
        <p className={styles.lead}>A fixed-supply economic layer designed around users, creators, partners and measurable ecosystem growth.</p>
        <div className={styles.heroStats}>
          <div><strong>1,000,000,000</strong><span>Fixed max supply</span></div>
          <div className={styles.emphasis}><strong>70%</strong><span>Community & ecosystem growth</span></div>
          <div><strong>XLAP</strong><span>BNB Chain ecosystem token</span></div>
        </div>
        <div className={styles.flow}><span>XP proves contribution</span><ArrowRight size={16}/><span>Genesis amplifies membership</span><ArrowRight size={16}/><span>XLAP powers participation</span></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><span>01</span><div><h2>Built for the network</h2><p>70% of supply is allocated to community, ecosystem rewards, partner launches and creators over time — not released at once.</p></div></div>
        <div className={styles.pillars}>{pillars.map(({icon: Icon,title,text}) => <article className={styles.pillar} key={title}><Icon size={22}/><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><span>02</span><div><h2>Allocation</h2><p>Every allocation has a defined role in the Unlimited X economy.</p></div></div>
        <div className={styles.allocationGrid}>
          {allocations.map((item) => <article className={styles.allocation} key={item.name}><div className={styles.allocationTop}><div><h3>{item.name}</h3><small>{item.amount} XLAP</small></div><strong>{item.pct}%</strong></div><div className={styles.bar}><i style={{width:`${item.pct * 4}%`}} /></div><p>{item.note}</p></article>)}
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionHead}><span>03</span><div><h2>Participation, not point conversion</h2><p>XP is reputation. It is not a fixed exchange rate for XLAP.</p></div></div>
        <div className={styles.pipeline}><b>Verified activity</b><ArrowRight/><b>XP & history</b><ArrowRight/><b>Eligibility</b><ArrowRight/><b>Allocation</b><ArrowRight/><b>Rewards</b></div>
        <p className={styles.explain}>Airdrop allocations can consider verified missions, campaign participation, retention, qualified referrals, achievements and trusted activity. Genesis can provide membership benefits without becoming a requirement to qualify.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><span>04</span><div><h2>Long-term alignment</h2><p>Unlocks are structured to favor ecosystem growth over short-term supply release.</p></div></div>
        <div className={styles.vesting}>{vesting.map(([name,tge,release]) => <div className={styles.vestingRow} key={name}><strong>{name}</strong><span>{tge}</span><span>{release}</span></div>)}</div>
        <div className={styles.tgeNote}><LockKeyhole size={18}/><p><strong>Low initial release by design.</strong> TGE percentages above refer to each allocation, not the total supply. Exact launch execution remains subject to final launch, liquidity, legal and market-readiness decisions.</p></div>
      </section>

      <section className={styles.xpower}>
        <div><span className={styles.mini}>FUTURE UTILITY</span><h2>Lock XLAP. Build X Power.</h2><p>X Power is designed as a non-transferable participation layer for ecosystem access, status, governance and limited benefits — focused on alignment rather than endless inflation.</p></div>
        <div className={styles.lockGrid}>{["30 DAYS","90 DAYS","180 DAYS","365 DAYS"].map((x,i)=><div key={x}><small>LOCK</small><strong>{x}</strong><span>{i===3?"Maximum alignment":"Increasing X Power"}</span></div>)}</div>
      </section>

      <section className={styles.footerNote}>
        <h2>One economy. Multiple ways to contribute.</h2>
        <p>Users participate. Creators activate. Partners expand. XLAP connects them.</p>
        <small>Tokenomics V1.0 describes the intended economic design. It does not guarantee an airdrop, token value, yield, allocation or future return. Final launch parameters may be refined before TGE.</small>
      </section>
    </div>
  );
}
