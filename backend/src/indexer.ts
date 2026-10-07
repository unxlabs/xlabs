import { createPublicClient, decodeEventLog, http, parseAbiItem, type Address, type Log } from "viem";
import { bsc } from "viem/chains";

interface Env { DB: D1Database; BNB_RPC_URL: string }

const CHAIN_ID = 56;
const CONFIRMATIONS = 15n;
const RPC_LOG_CHUNK = 900n;
const LIVE_CHUNK = RPC_LOG_CHUNK;
const BACKFILL_CHUNK = RPC_LOG_CHUNK;

const CONTRACTS = [
  { key: "genesis", address: "0x3d71D114B58bd47477BDf5DEF6620a5b0F23842E" },
  { key: "earn_bfbtc", address: "0x701819f06804398304fDE6b7f46278bDF1Cfa39F" },
  { key: "earn_bfusd", address: "0xeff37c33EFA31a7ae87db4f09f260562f900C719" },
  { key: "stake_bnb", address: "0x3b2A4eFF7FC2C18fF11d6a687342eCAB4E4512f6" },
  { key: "stake_btcb", address: "0xd436FBbA8C770862B815D575519347Fb6E450978" },
  { key: "stake_usdt", address: "0xa381410664bB7bE241aA456D2C3130474E28013d" },
] as const satisfies readonly { key: string; address: Address }[];

const GENESIS_MINT = parseAbiItem("event GenesisPassMinted(address indexed buyer, uint256 quantity, uint256 totalPaid)");


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const POSITION_DISCOVERY_LIMIT = 25;
const POSITION_REFRESH_LIMIT = 100;

const EARN_POSITION_ABI = [{
  type: "function", name: "getPosition", stateMutability: "view",
  inputs: [{ name: "id", type: "uint256" }],
  outputs: [{ name: "", type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "user", type: "address" }, { name: "principal", type: "uint256" },
    { name: "createdAt", type: "uint256" }, { name: "withdrawalRequestedAt", type: "uint256" }, { name: "fundedAt", type: "uint256" },
    { name: "withdrawnAt", type: "uint256" }, { name: "withdrawalFunded", type: "uint256" }, { name: "status", type: "uint8" }
  ]}]
}] as const;

const STAKE_POSITION_ABI = [{
  type: "function", name: "getPosition", stateMutability: "view",
  inputs: [{ name: "positionId", type: "uint256" }],
  outputs: [{ name: "", type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "poolId", type: "uint256" }, { name: "user", type: "address" },
    { name: "principal", type: "uint256" }, { name: "fundedForWithdrawal", type: "uint256" }, { name: "createdAt", type: "uint64" },
    { name: "lockStartedAt", type: "uint64" }, { name: "lockEndsAt", type: "uint64" }, { name: "unlockRequestedAt", type: "uint64" },
    { name: "claimableAt", type: "uint64" }, { name: "withdrawnAt", type: "uint64" }, { name: "status", type: "uint8" }
  ]}]
}] as const;

type EarnPosition = { id: bigint; user: Address; principal: bigint; createdAt: bigint; withdrawalRequestedAt: bigint; fundedAt: bigint; withdrawnAt: bigint; withdrawalFunded: bigint; status: number };
type StakePosition = { id: bigint; poolId: bigint; user: Address; principal: bigint; fundedForWithdrawal: bigint; createdAt: bigint; lockStartedAt: bigint; lockEndsAt: bigint; unlockRequestedAt: bigint; claimableAt: bigint; withdrawnAt: bigint; status: number };

const POSITION_CONTRACTS = CONTRACTS.filter((c) => c.key.startsWith("earn_") || c.key.startsWith("stake_"));

type StateRow = { live_cursor_block: number | null; backfill_cursor_block: number | null; latest_finalized_block: number | null };

function contractKey(address: string) {
  const lower = address.toLowerCase();
  return CONTRACTS.find((c) => c.address.toLowerCase() === lower)?.key ?? "unknown";
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" } });
}

async function state(db: D1Database): Promise<StateRow | null> {
  return db.prepare("SELECT live_cursor_block,backfill_cursor_block,latest_finalized_block FROM chain_indexer_state WHERE chain_id=?").bind(CHAIN_ID).first<StateRow>();
}

async function saveEvent(db: D1Database, log: Log, now: number, blockTimestamp: number | null) {
  if (log.blockNumber == null || !log.blockHash || !log.transactionHash || log.logIndex == null || !log.address) return;
  const key = contractKey(log.address);
  let eventName: string | null = null;
  let decodedArgs: string | null = null;
  let genesis: { buyer: string; quantity: bigint; totalPaid: bigint } | null = null;

  if (key === "genesis") {
    try {
      const decoded = decodeEventLog({ abi: [GENESIS_MINT], data: log.data, topics: log.topics, strict: true });
      if (decoded.eventName === "GenesisPassMinted") {
        const args = decoded.args as { buyer: Address; quantity: bigint; totalPaid: bigint };
        eventName = decoded.eventName;
        decodedArgs = JSON.stringify({ buyer: args.buyer.toLowerCase(), quantity: args.quantity.toString(), totalPaid: args.totalPaid.toString() });
        genesis = args;
      }
    } catch { /* Other ERC-1155/admin events remain safely stored as raw logs. */ }
  }

  const id = `${CHAIN_ID}:${log.transactionHash.toLowerCase()}:${log.logIndex}`;
  await db.prepare(`INSERT OR IGNORE INTO chain_events
    (id,chain_id,contract_key,contract_address,block_number,block_hash,transaction_hash,transaction_index,log_index,topic0,topics,data,event_name,decoded_args,block_timestamp,observed_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, CHAIN_ID, key, log.address.toLowerCase(), Number(log.blockNumber), log.blockHash.toLowerCase(), log.transactionHash.toLowerCase(), log.transactionIndex == null ? null : Number(log.transactionIndex), log.logIndex, log.topics[0] ?? null, JSON.stringify(log.topics), log.data, eventName, decodedArgs, blockTimestamp, now, now).run();

  if (genesis) {
    await db.prepare(`INSERT OR IGNORE INTO genesis_mint_events
      (chain_event_id,buyer_address,quantity_atomic,total_paid_atomic,block_number,transaction_hash,occurred_at)
      VALUES (?,?,?,?,?,?,?)`)
      .bind(id, genesis.buyer.toLowerCase(), genesis.quantity.toString(), genesis.totalPaid.toString(), Number(log.blockNumber), log.transactionHash.toLowerCase(), blockTimestamp ?? now).run();
  }
}

async function scanRange(env: Env, client: ReturnType<typeof createPublicClient>, from: bigint, to: bigint) {
  if (to < from) return 0;
  const logs = await client.getLogs({ address: CONTRACTS.map((c) => c.address), fromBlock: from, toBlock: to });
  const now = Date.now();
  const blockNumbers = [...new Set(logs.flatMap((log) => log.blockNumber == null ? [] : [log.blockNumber]))];
  const timestamps = new Map<string, number>();
  await Promise.all(blockNumbers.map(async (blockNumber) => {
    const block = await client.getBlock({ blockNumber });
    timestamps.set(blockNumber.toString(), Number(block.timestamp) * 1000);
  }));
  for (const log of logs) await saveEvent(env.DB, log, now, log.blockNumber == null ? null : (timestamps.get(log.blockNumber.toString()) ?? null));
  return logs.length;
}


function isRealPosition(position: EarnPosition | StakePosition) {
  return position.id > 0n && position.user.toLowerCase() !== ZERO_ADDRESS;
}

async function readPosition(client: ReturnType<typeof createPublicClient>, key: string, address: Address, positionId: bigint) {
  if (key.startsWith("earn_")) {
    return await client.readContract({ address, abi: EARN_POSITION_ABI, functionName: "getPosition", args: [positionId] }) as EarnPosition;
  }
  return await client.readContract({ address, abi: STAKE_POSITION_ABI, functionName: "getPosition", args: [positionId] }) as StakePosition;
}

async function savePosition(db: D1Database, key: string, address: Address, position: EarnPosition | StakePosition, now: number) {
  const isStake = key.startsWith("stake_");
  const stake = isStake ? position as StakePosition : null;
  const earn = !isStake ? position as EarnPosition : null;
  const id = `${CHAIN_ID}:${address.toLowerCase()}:${position.id.toString()}`;
  await db.prepare(`INSERT INTO chain_positions
    (id,chain_id,product_type,contract_key,contract_address,position_id,pool_id,user_address,principal_atomic,funded_for_withdrawal_atomic,status,
     created_at_chain,lock_started_at_chain,lock_ends_at_chain,withdrawal_requested_at_chain,funded_at_chain,claimable_at_chain,withdrawn_at_chain,first_seen_at,last_synced_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(chain_id,contract_address,position_id) DO UPDATE SET
      user_address=excluded.user_address,principal_atomic=excluded.principal_atomic,funded_for_withdrawal_atomic=excluded.funded_for_withdrawal_atomic,
      status=excluded.status,lock_started_at_chain=excluded.lock_started_at_chain,lock_ends_at_chain=excluded.lock_ends_at_chain,
      withdrawal_requested_at_chain=excluded.withdrawal_requested_at_chain,funded_at_chain=excluded.funded_at_chain,
      claimable_at_chain=excluded.claimable_at_chain,withdrawn_at_chain=excluded.withdrawn_at_chain,last_synced_at=excluded.last_synced_at`)
    .bind(id, CHAIN_ID, isStake ? "stake" : "earn", key, address.toLowerCase(), Number(position.id), stake?.poolId.toString() ?? null,
      position.user.toLowerCase(), position.principal.toString(), (stake?.fundedForWithdrawal ?? earn?.withdrawalFunded)?.toString() ?? null, Number(position.status),
      Number(position.createdAt) * 1000, stake ? Number(stake.lockStartedAt) * 1000 : null, stake ? Number(stake.lockEndsAt) * 1000 : null,
      stake ? Number(stake.unlockRequestedAt) * 1000 : Number(earn!.withdrawalRequestedAt) * 1000, earn ? Number(earn.fundedAt) * 1000 : null,
      stake ? Number(stake.claimableAt) * 1000 : null, Number(position.withdrawnAt) * 1000, now, now).run();
}

async function ensurePositionScanState(db: D1Database, now: number) {
  for (const c of POSITION_CONTRACTS) {
    await db.prepare(`INSERT OR IGNORE INTO chain_position_scan_state
      (chain_id,contract_key,contract_address,next_position_id,last_scan_at,last_success_at,last_error,updated_at)
      VALUES (?,?,?,1,NULL,NULL,NULL,?)`).bind(CHAIN_ID, c.key, c.address.toLowerCase(), now).run();
  }
}

async function discoverPositions(env: Env, client: ReturnType<typeof createPublicClient>) {
  const now = Date.now();
  await ensurePositionScanState(env.DB, now);
  let discovered = 0;
  for (const c of POSITION_CONTRACTS) {
    const row = await env.DB.prepare("SELECT next_position_id FROM chain_position_scan_state WHERE chain_id=? AND contract_key=?")
      .bind(CHAIN_ID, c.key).first<{ next_position_id: number }>();
    let next = BigInt(row?.next_position_id ?? 1);
    let contractDiscovered = 0;
    try {
      for (let i = 0; i < POSITION_DISCOVERY_LIMIT; i++) {
        let position: EarnPosition | StakePosition;
        try { position = await readPosition(client, c.key, c.address, next); }
        catch { break; }
        if (!isRealPosition(position)) break;
        await savePosition(env.DB, c.key, c.address, position, now);
        next += 1n;
        discovered += 1;
        contractDiscovered += 1;
      }
      await env.DB.prepare(`UPDATE chain_position_scan_state SET next_position_id=?,last_scan_at=?,last_success_at=?,last_error=NULL,updated_at=? WHERE chain_id=? AND contract_key=?`)
        .bind(Number(next), now, now, now, CHAIN_ID, c.key).run();
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000);
      await env.DB.prepare("UPDATE chain_position_scan_state SET last_scan_at=?,last_error=?,updated_at=? WHERE chain_id=? AND contract_key=?")
        .bind(now, message, now, CHAIN_ID, c.key).run();
    }
    if (contractDiscovered === POSITION_DISCOVERY_LIMIT) console.log("Position discovery batch capped", { contract: c.key, next: next.toString() });
  }
  return discovered;
}

async function refreshPositions(env: Env, client: ReturnType<typeof createPublicClient>) {
  const rows = await env.DB.prepare(`SELECT contract_key,contract_address,position_id FROM chain_positions WHERE chain_id=? ORDER BY last_synced_at ASC LIMIT ?`)
    .bind(CHAIN_ID, POSITION_REFRESH_LIMIT).all<{ contract_key: string; contract_address: string; position_id: number }>();
  const now = Date.now();
  let refreshed = 0;
  for (const row of rows.results ?? []) {
    try {
      const position = await readPosition(client, row.contract_key, row.contract_address as Address, BigInt(row.position_id));
      if (!isRealPosition(position)) continue;
      await savePosition(env.DB, row.contract_key, row.contract_address as Address, position, now);
      refreshed += 1;
    } catch (error) {
      console.warn("Position refresh failed", { contract: row.contract_key, positionId: row.position_id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return refreshed;
}

async function runIndexer(env: Env) {
  const started = Date.now();
  const client = createPublicClient({ chain: bsc, transport: http(env.BNB_RPC_URL, { timeout: 20_000, retryCount: 2 }) });
  const head = await client.getBlockNumber();
  const finalized = head > CONFIRMATIONS ? head - CONFIRMATIONS : 0n;
  let s = await state(env.DB);

  if (!s) {
    await env.DB.prepare(`INSERT INTO chain_indexer_state
      (chain_id,live_cursor_block,backfill_cursor_block,latest_finalized_block,last_run_at,last_success_at,last_error,updated_at)
      VALUES (?,?,?,?,?,?,NULL,?)`).bind(CHAIN_ID, Number(finalized), Number(finalized + 1n), Number(finalized), started, null, started).run();
    s = { live_cursor_block: Number(finalized), backfill_cursor_block: Number(finalized + 1n), latest_finalized_block: Number(finalized) };
  }

  let liveCursor = BigInt(s.live_cursor_block ?? Number(finalized));
  let backfillCursor = BigInt(s.backfill_cursor_block ?? Number(finalized));
  let liveLogs = 0, backfillLogs = 0;

  try {
    while (liveCursor < finalized) {
      const from = liveCursor + 1n;
      const to = from + LIVE_CHUNK - 1n > finalized ? finalized : from + LIVE_CHUNK - 1n;
      liveLogs += await scanRange(env, client, from, to);
      liveCursor = to;
      await env.DB.prepare("UPDATE chain_indexer_state SET live_cursor_block=?,latest_finalized_block=?,last_run_at=?,last_error=NULL,updated_at=? WHERE chain_id=?")
        .bind(Number(liveCursor), Number(finalized), started, Date.now(), CHAIN_ID).run();
    }

    if (backfillCursor > 0n) {
      const to = backfillCursor - 1n;
      const from = to >= BACKFILL_CHUNK - 1n ? to - BACKFILL_CHUNK + 1n : 0n;
      backfillLogs = await scanRange(env, client, from, to);
      backfillCursor = from;
      await env.DB.prepare("UPDATE chain_indexer_state SET backfill_cursor_block=?,latest_finalized_block=?,last_run_at=?,last_error=NULL,updated_at=? WHERE chain_id=?")
        .bind(Number(backfillCursor), Number(finalized), started, Date.now(), CHAIN_ID).run();
    }

    const discoveredPositions = await discoverPositions(env, client);
    const refreshedPositions = await refreshPositions(env, client);

    await env.DB.prepare(`UPDATE chain_indexer_state SET live_cursor_block=?,backfill_cursor_block=?,latest_finalized_block=?,last_run_at=?,last_success_at=?,last_error=NULL,updated_at=? WHERE chain_id=?`)
      .bind(Number(liveCursor), Number(backfillCursor), Number(finalized), started, Date.now(), Date.now(), CHAIN_ID).run();
    return { success: true, head: head.toString(), finalized: finalized.toString(), liveCursor: liveCursor.toString(), backfillCursor: backfillCursor.toString(), liveLogs, backfillLogs, discoveredPositions, refreshedPositions };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000);
    await env.DB.prepare("UPDATE chain_indexer_state SET last_run_at=?,last_error=?,updated_at=? WHERE chain_id=?").bind(started, message, Date.now(), CHAIN_ID).run();
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      const s = await env.DB.prepare("SELECT chain_id,live_cursor_block,backfill_cursor_block,latest_finalized_block,last_run_at,last_success_at,last_error,updated_at FROM chain_indexer_state WHERE chain_id=?").bind(CHAIN_ID).first();
      const counts = await env.DB.prepare("SELECT COUNT(*) AS event_count,COUNT(DISTINCT transaction_hash) AS tx_count FROM chain_events WHERE chain_id=?").bind(CHAIN_ID).first();
      const positions = await env.DB.prepare("SELECT product_type,COUNT(*) AS position_count,SUM(CASE WHEN status=1 THEN 1 ELSE 0 END) AS active_count FROM chain_positions WHERE chain_id=? GROUP BY product_type").bind(CHAIN_ID).all();
      const positionScans = await env.DB.prepare("SELECT contract_key,next_position_id,last_success_at,last_error FROM chain_position_scan_state WHERE chain_id=? ORDER BY contract_key").bind(CHAIN_ID).all();
      return json({ success: true, service: "unlimited-x-labs-indexer", chainId: CHAIN_ID, trackedContracts: CONTRACTS.length, state: s, counts, positions: positions.results ?? [], positionScans: positionScans.results ?? [] });
    }
    return json({ success: false, error: "Not Found" }, 404);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runIndexer(env).then((r) => console.log("Indexer run complete", r)).catch((e) => console.error("Indexer run failed", e)));
  },
};
