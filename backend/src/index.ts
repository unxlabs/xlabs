import {

  createPublicClient,

  getAddress,

  http,

  isAddress,

  parseAbi,

  verifyMessage,

  type Hex,

} from "viem";



export interface Env {

  DB: D1Database;

  BNB_RPC_URL: string;

}



const AUTH_CHAIN_ID = 56;

const AUTH_CHALLENGE_TTL_SECONDS = 5 * 60;

const AUTH_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const GENESIS_CONTRACT_ADDRESS =
  "0x3d71D114B58bd47477BDf5DEF6620a5b0F23842E" as const;
const GENESIS_PASS_ID = 1n;
const GENESIS_SYNC_COOLDOWN_MS = 60 * 1000;
const GENESIS_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
]);



const ALLOWED_ORIGINS = new Set([

  "https://unxlabs.xyz",

  "https://www.unxlabs.xyz",

  "http://localhost:5173",

  "http://127.0.0.1:5173",

]);



interface AuthChallengeRow {

  id: string;

  wallet_address: string;

  chain_id: number;

  nonce: string;

  message: string;

  status: "pending" | "used" | "expired";

  created_at: number;

  expires_at: number;

  used_at: number | null;

}



interface WalletRow {

  id: string;

  user_id: string;

  address: string;

  chain_id: number;

  is_primary: number;

  status: string;

  connected_at: number;

  last_seen_at: number;

}



interface UserRow {

  id: string;

  username: string | null;

  referral_code: string;

  referred_by_user_id: string | null;

  country: string | null;

  status: string;

  created_at: number;

  last_active_at: number;

}



interface AuthSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  status: "active" | "revoked" | "expired";
  created_at: number;
  expires_at: number;
  last_seen_at: number;
  revoked_at: number | null;
}

interface GenesisOwnershipRow {
  user_id: string;
  wallet_address: string;
  chain_id: number;
  contract_address: string;
  token_id: string;
  balance: number;
  tier_key: string;
  tier_name: string;
  xp_boost_percent: number;
  referral_boost_percent: number;
  synced_at: number;
  created_at: number;
  updated_at: number;
}

interface AuthenticatedContext {
  session: AuthSessionRow;
  user: UserRow;
  wallet: WalletRow;
}

interface AdminUserRow {
  user_id: string;
  role: "admin" | "super_admin";
  status: "active" | "disabled";
  created_at: number;
  updated_at: number;
}

interface CountRow {
  count: number;
}

interface SumRow {
  total: number | null;
}

interface TierDistributionRow {
  tier_key: string;
  tier_name: string;
  holders: number;
  passes: number;
}

const SESSION_COOKIE_NAME = "__Host-unxlabs_session";

function isLocalDevelopmentOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return (
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173"
  );
}

function buildSessionCookie(
  request: Request,
  token: string,
  maxAgeSeconds: number,
): string {
  const sameSite = isLocalDevelopmentOrigin(request) ? "None" : "Lax";
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

function buildExpiredSessionCookie(request: Request): string {
  return buildSessionCookie(request, "", 0);
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = part.trim().split("=");
    if (rawName === name) return rawValueParts.join("=") || null;
  }
  return null;
}

function getCorsHeaders(request: Request): HeadersInit {

  const origin = request.headers.get("Origin");



  const headers: Record<string, string> = {

    Vary: "Origin",

  };



  if (origin && ALLOWED_ORIGINS.has(origin)) {

    headers["Access-Control-Allow-Origin"] = origin;

    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";

    headers["Access-Control-Allow-Headers"] =

      "Content-Type, Authorization";

    headers["Access-Control-Allow-Credentials"] = "true";

    headers["Access-Control-Max-Age"] = "86400";

  }



  return headers;

}



function jsonResponse(

  request: Request,

  data: unknown,

  status = 200,

  extraHeaders: HeadersInit = {},

): Response {

  return new Response(JSON.stringify(data, null, 2), {

    status,

    headers: {

      "Content-Type": "application/json; charset=UTF-8",

      "Cache-Control": "no-store",

      ...getCorsHeaders(request),

      ...extraHeaders,

    },

  });

}



function optionsResponse(request: Request): Response {

  const origin = request.headers.get("Origin");



  if (!origin || !ALLOWED_ORIGINS.has(origin)) {

    return new Response(null, {

      status: 403,

      headers: {

        Vary: "Origin",

      },

    });

  }



  return new Response(null, {

    status: 204,

    headers: getCorsHeaders(request),

  });

}



function generateRandomHex(byteLength = 32): string {

  const bytes = new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);



  return Array.from(bytes)

    .map((byte) => byte.toString(16).padStart(2, "0"))

    .join("");

}



function generateNonce(): string {

  return generateRandomHex(32);

}



function generateSessionToken(): string {

  return generateRandomHex(48);

}



function generateReferralCode(): string {

  return generateRandomHex(8).toUpperCase();

}



async function sha256(value: string): Promise<string> {

  const data = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest("SHA-256", data);



  return Array.from(new Uint8Array(digest))

    .map((byte) => byte.toString(16).padStart(2, "0"))

    .join("");

}



function buildAuthMessage(params: {

  address: string;

  nonce: string;

  issuedAt: number;

  expiresAt: number;

}): string {

  const { address, nonce, issuedAt, expiresAt } = params;



  return [

    "Unlimited X Labs",

    "",

    "Sign this message to authenticate your wallet.",

    "This request will not trigger a blockchain transaction or cost gas.",

    "",

    `Wallet: ${address}`,

    `Chain ID: ${AUTH_CHAIN_ID}`,

    `Nonce: ${nonce}`,

    `Issued At: ${new Date(issuedAt).toISOString()}`,

    `Expiration Time: ${new Date(expiresAt).toISOString()}`,

  ].join("\n");

}



async function createUniqueReferralCode(

  db: D1Database,

): Promise<string> {

  for (let attempt = 0; attempt < 10; attempt++) {

    const referralCode = generateReferralCode();



    const existing = await db

      .prepare(

        `

        SELECT id

        FROM users

        WHERE referral_code = ?

        LIMIT 1

        `,

      )

      .bind(referralCode)

      .first<{ id: string }>();



    if (!existing) {

      return referralCode;

    }

  }



  throw new Error("Unable to generate a unique referral code.");

}



function getGenesisTier(balance: number) {
  if (balance >= 50) return { key: "founder", name: "Founder", xpBoost: 75, referralBoost: 35 };
  if (balance >= 25) return { key: "prime", name: "Prime", xpBoost: 55, referralBoost: 25 };
  if (balance >= 10) return { key: "apex", name: "Apex", xpBoost: 40, referralBoost: 20 };
  if (balance >= 5) return { key: "elite", name: "Elite", xpBoost: 30, referralBoost: 15 };
  if (balance >= 3) return { key: "genesis_plus", name: "Genesis+", xpBoost: 20, referralBoost: 10 };
  if (balance >= 1) return { key: "genesis", name: "Genesis", xpBoost: 10, referralBoost: 5 };
  return { key: "none", name: "None", xpBoost: 0, referralBoost: 0 };
}

function serializeGenesisOwnership(row: GenesisOwnershipRow) {
  return {
    walletAddress: getAddress(row.wallet_address),
    chainId: row.chain_id,
    contractAddress: getAddress(row.contract_address),
    tokenId: row.token_id,
    balance: row.balance,
    tier: { key: row.tier_key, name: row.tier_name },
    xpBoostPercent: row.xp_boost_percent,
    referralBoostPercent: row.referral_boost_percent,
    syncedAt: row.synced_at,
  };
}

async function getAuthenticatedContext(
  request: Request,
  env: Env,
): Promise<AuthenticatedContext | null> {
  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;

  const tokenHash = await sha256(sessionToken);
  const now = Date.now();
  const session = await env.DB.prepare(
    `SELECT id, user_id, token_hash, status, created_at,
            expires_at, last_seen_at, revoked_at
     FROM auth_sessions
     WHERE token_hash = ?
     LIMIT 1`,
  ).bind(tokenHash).first<AuthSessionRow>();

  if (!session || session.status !== "active" || session.expires_at <= now) return null;

  const user = await env.DB.prepare(
    `SELECT id, username, referral_code, referred_by_user_id,
            country, status, created_at, last_active_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
  ).bind(session.user_id).first<UserRow>();
  if (!user || user.status !== "active") return null;

  const wallet = await env.DB.prepare(
    `SELECT id, user_id, address, chain_id, is_primary, status,
            connected_at, last_seen_at
     FROM wallets
     WHERE user_id = ? AND is_primary = 1
     ORDER BY connected_at ASC
     LIMIT 1`,
  ).bind(user.id).first<WalletRow>();

  if (!wallet || wallet.status === "blocked" || wallet.chain_id !== AUTH_CHAIN_ID) return null;
  return { session, user, wallet };
}

async function getActiveAdmin(
  db: D1Database,
  userId: string,
): Promise<AdminUserRow | null> {
  return db.prepare(
    `SELECT user_id, role, status, created_at, updated_at
     FROM admin_users
     WHERE user_id = ? AND status = 'active'
     LIMIT 1`,
  ).bind(userId).first<AdminUserRow>();
}

async function getGenesisOwnership(
  db: D1Database,
  userId: string,
): Promise<GenesisOwnershipRow | null> {
  return db.prepare(
    `SELECT user_id, wallet_address, chain_id, contract_address, token_id,
            balance, tier_key, tier_name, xp_boost_percent,
            referral_boost_percent, synced_at, created_at, updated_at
     FROM genesis_ownership
     WHERE user_id = ?
     LIMIT 1`,
  ).bind(userId).first<GenesisOwnershipRow>();
}

export default {

  async fetch(

    request: Request,

    env: Env,

    _ctx: ExecutionContext,

  ): Promise<Response> {

    const url = new URL(request.url);



    // =========================================================

    // CORS PREFLIGHT

    // =========================================================



    if (request.method === "OPTIONS") {

      return optionsResponse(request);

    }



    // =========================================================

    // API HOME

    // =========================================================



    if (request.method === "GET" && url.pathname === "/") {

      return jsonResponse(request, {

        success: true,

        project: "Unlimited X Labs",

        service: "API",

        message: "Unlimited X Labs API is running.",

      });

    }



    // =========================================================

    // HEALTH CHECK

    // =========================================================



    if (request.method === "GET" && url.pathname === "/health") {

      try {

        const result = await env.DB.prepare(

          "SELECT COUNT(*) AS user_count FROM users",

        ).first<{ user_count: number }>();



        return jsonResponse(request, {

          success: true,

          status: "ok",

          service: "unlimited-x-labs-api",

          database: {

            connected: true,

            userCount: result?.user_count ?? 0,

          },

        });

      } catch (error) {

        console.error("Health check failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            status: "error",

            service: "unlimited-x-labs-api",

            database: {

              connected: false,

            },

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH CHALLENGE

    // =========================================================



    if (

      request.method === "POST" &&

      url.pathname === "/auth/challenge"

    ) {

      try {

        let body: unknown;



        try {

          body = await request.json();

        } catch {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid JSON body.",

            },

            400,

          );

        }



        if (

          typeof body !== "object" ||

          body === null ||

          !("address" in body) ||

          typeof body.address !== "string"

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Wallet address is required.",

            },

            400,

          );

        }



        const suppliedAddress = body.address.trim();



        if (!isAddress(suppliedAddress)) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid EVM wallet address.",

            },

            400,

          );

        }



        const checksumAddress = getAddress(suppliedAddress);

        const normalizedAddress = checksumAddress.toLowerCase();



        const now = Date.now();

        const expiresAt =

          now + AUTH_CHALLENGE_TTL_SECONDS * 1000;



        const challengeId = crypto.randomUUID();

        const nonce = generateNonce();



        const message = buildAuthMessage({

          address: checksumAddress,

          nonce,

          issuedAt: now,

          expiresAt,

        });



        await env.DB.prepare(

          `

          UPDATE auth_nonces

          SET status = 'expired'

          WHERE wallet_address = ?

            AND chain_id = ?

            AND status = 'pending'

          `,

        )

          .bind(normalizedAddress, AUTH_CHAIN_ID)

          .run();



        await env.DB.prepare(

          `

          INSERT INTO auth_nonces (

            id,

            wallet_address,

            chain_id,

            nonce,

            message,

            status,

            created_at,

            expires_at,

            used_at

          )

          VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL)

          `,

        )

          .bind(

            challengeId,

            normalizedAddress,

            AUTH_CHAIN_ID,

            nonce,

            message,

            now,

            expiresAt,

          )

          .run();



        return jsonResponse(request, {

          success: true,

          challenge: {

            id: challengeId,

            address: checksumAddress,

            chainId: AUTH_CHAIN_ID,

            message,

            expiresAt,

          },

        });

      } catch (error) {

        console.error("Auth challenge failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            error:

              "Unable to create authentication challenge.",

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH VERIFY

    //

    // Verifies wallet ownership, consumes the one-time challenge,

    // creates or finds the Unlimited X Labs identity, and creates

    // an authenticated session.

    // =========================================================



    if (

      request.method === "POST" &&

      url.pathname === "/auth/verify"

    ) {

      try {

        let body: unknown;



        try {

          body = await request.json();

        } catch {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid JSON body.",

            },

            400,

          );

        }



        if (

          typeof body !== "object" ||

          body === null ||

          !("challengeId" in body) ||

          typeof body.challengeId !== "string" ||

          !("signature" in body) ||

          typeof body.signature !== "string"

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Challenge ID and signature are required.",

            },

            400,

          );

        }



        const challengeId = body.challengeId.trim();

        const signature = body.signature.trim();



        if (

          !/^0x[0-9a-fA-F]+$/.test(signature) ||

          signature.length !== 132

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid wallet signature.",

            },

            400,

          );

        }



        const challenge = await env.DB.prepare(

          `

          SELECT

            id,

            wallet_address,

            chain_id,

            nonce,

            message,

            status,

            created_at,

            expires_at,

            used_at

          FROM auth_nonces

          WHERE id = ?

          LIMIT 1

          `,

        )

          .bind(challengeId)

          .first<AuthChallengeRow>();



        if (!challenge) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge not found.",

            },

            404,

          );

        }



        if (challenge.chain_id !== AUTH_CHAIN_ID) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Unsupported authentication chain.",

            },

            400,

          );

        }



        if (challenge.status !== "pending") {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge has already been used or expired.",

            },

            409,

          );

        }



        const now = Date.now();



        if (challenge.expires_at <= now) {

          await env.DB.prepare(

            `

            UPDATE auth_nonces

            SET status = 'expired'

            WHERE id = ?

              AND status = 'pending'

            `,

          )

            .bind(challenge.id)

            .run();



          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge has expired.",

            },

            410,

          );

        }



        const walletAddress = getAddress(

          challenge.wallet_address,

        );



        let signatureValid = false;



        try {

          signatureValid = await verifyMessage({

            address: walletAddress,

            message: challenge.message,

            signature: signature as Hex,

          });

        } catch {

          signatureValid = false;

        }



        if (!signatureValid) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Wallet signature verification failed.",

            },

            401,

          );

        }



        // Consume the challenge atomically.

        // Only one request can change pending -> used.

        const consumeResult = await env.DB.prepare(

          `

          UPDATE auth_nonces

          SET

            status = 'used',

            used_at = ?

          WHERE id = ?

            AND status = 'pending'

            AND expires_at > ?

          `,

        )

          .bind(now, challenge.id, now)

          .run();



        if (consumeResult.meta.changes !== 1) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge is no longer valid.",

            },

            409,

          );

        }



        const normalizedAddress =

          challenge.wallet_address.toLowerCase();



        let wallet = await env.DB.prepare(

          `

          SELECT

            id,

            user_id,

            address,

            chain_id,

            is_primary,

            status,

            connected_at,

            last_seen_at

          FROM wallets

          WHERE address = ?

            AND chain_id = ?

          LIMIT 1

          `,

        )

          .bind(normalizedAddress, AUTH_CHAIN_ID)

          .first<WalletRow>();



        let user: UserRow | null = null;

        let isNewUser = false;



        if (wallet) {

          if (wallet.status === "blocked") {

            return jsonResponse(

              request,

              {

                success: false,

                error: "This wallet is blocked.",

              },

              403,

            );

          }



          user = await env.DB.prepare(

            `

            SELECT

              id,

              username,

              referral_code,

              referred_by_user_id,

              country,

              status,

              created_at,

              last_active_at

            FROM users

            WHERE id = ?

            LIMIT 1

            `,

          )

            .bind(wallet.user_id)

            .first<UserRow>();



          if (!user) {

            throw new Error(

              "Wallet is linked to a missing user identity.",

            );

          }



          if (user.status !== "active") {

            return jsonResponse(

              request,

              {

                success: false,

                error: "This account is not active.",

              },

              403,

            );

          }



          await env.DB.batch([

            env.DB.prepare(

              `

              UPDATE users

              SET last_active_at = ?

              WHERE id = ?

              `,

            ).bind(now, user.id),



            env.DB.prepare(

              `

              UPDATE wallets

              SET

                last_seen_at = ?,

                status = 'active'

              WHERE id = ?

              `,

            ).bind(now, wallet.id),

          ]);



          user.last_active_at = now;

          wallet.last_seen_at = now;

          wallet.status = "active";

        } else {

          isNewUser = true;



          const userId = crypto.randomUUID();

          const walletId = crypto.randomUUID();

          const referralCode =

            await createUniqueReferralCode(env.DB);



          await env.DB.batch([

            env.DB.prepare(

              `

              INSERT INTO users (

                id,

                username,

                referral_code,

                referred_by_user_id,

                country,

                status,

                created_at,

                last_active_at

              )

              VALUES (?, NULL, ?, NULL, NULL, 'active', ?, ?)

              `,

            ).bind(

              userId,

              referralCode,

              now,

              now,

            ),



            env.DB.prepare(

              `

              INSERT INTO wallets (

                id,

                user_id,

                address,

                chain_id,

                is_primary,

                status,

                connected_at,

                last_seen_at

              )

              VALUES (?, ?, ?, ?, 1, 'active', ?, ?)

              `,

            ).bind(

              walletId,

              userId,

              normalizedAddress,

              AUTH_CHAIN_ID,

              now,

              now,

            ),

          ]);



          user = {

            id: userId,

            username: null,

            referral_code: referralCode,

            referred_by_user_id: null,

            country: null,

            status: "active",

            created_at: now,

            last_active_at: now,

          };



          wallet = {

            id: walletId,

            user_id: userId,

            address: normalizedAddress,

            chain_id: AUTH_CHAIN_ID,

            is_primary: 1,

            status: "active",

            connected_at: now,

            last_seen_at: now,

          };

        }



        const sessionToken = generateSessionToken();

        const sessionTokenHash =

          await sha256(sessionToken);



        const sessionId = crypto.randomUUID();

        const sessionExpiresAt =

          now + AUTH_SESSION_TTL_SECONDS * 1000;



        await env.DB.prepare(

          `

          INSERT INTO auth_sessions (

            id,

            user_id,

            token_hash,

            status,

            created_at,

            expires_at,

            last_seen_at,

            revoked_at

          )

          VALUES (?, ?, ?, 'active', ?, ?, ?, NULL)

          `,

        )

          .bind(

            sessionId,

            user.id,

            sessionTokenHash,

            now,

            sessionExpiresAt,

            now,

          )

          .run();



        return jsonResponse(request, {

          success: true,

          authenticated: true,

          isNewUser,

          user: {

            id: user.id,

            username: user.username,

            referralCode: user.referral_code,

            country: user.country,

            status: user.status,

            createdAt: user.created_at,

          },

          wallet: {

            address: getAddress(wallet.address),

            chainId: wallet.chain_id,

            isPrimary: wallet.is_primary === 1,

          },

          session: {

            expiresAt: sessionExpiresAt,

          },

        }, 200, {

          "Set-Cookie": buildSessionCookie(

            request,

            sessionToken,

            AUTH_SESSION_TTL_SECONDS,

          ),

        });

      } catch (error) {

        console.error("Auth verification failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            error:

              "Unable to verify wallet authentication.",

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH ME

    // =========================================================

    if (request.method === "GET" && url.pathname === "/auth/me") {
      try {
        const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);

        if (!sessionToken) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const tokenHash = await sha256(sessionToken);
        const now = Date.now();

        const session = await env.DB.prepare(
          `
          SELECT id, user_id, token_hash, status, created_at,
                 expires_at, last_seen_at, revoked_at
          FROM auth_sessions
          WHERE token_hash = ?
          LIMIT 1
          `,
        )
          .bind(tokenHash)
          .first<AuthSessionRow>();

        if (!session || session.status !== "active") {
          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        if (session.expires_at <= now) {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'expired'
             WHERE id = ? AND status = 'active'`,
          )
            .bind(session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        const user = await env.DB.prepare(
          `
          SELECT id, username, referral_code, referred_by_user_id,
                 country, status, created_at, last_active_at
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
        )
          .bind(session.user_id)
          .first<UserRow>();

        if (!user || user.status !== "active") {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE id = ? AND status = 'active'`,
          )
            .bind(now, session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        const wallet = await env.DB.prepare(
          `
          SELECT id, user_id, address, chain_id, is_primary, status,
                 connected_at, last_seen_at
          FROM wallets
          WHERE user_id = ? AND is_primary = 1
          ORDER BY connected_at ASC
          LIMIT 1
          `,
        )
          .bind(user.id)
          .first<WalletRow>();

        if (!wallet || wallet.status === "blocked") {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE id = ? AND status = 'active'`,
          )
            .bind(now, session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        await env.DB.batch([
          env.DB.prepare(
            `UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?`,
          ).bind(now, session.id),
          env.DB.prepare(
            `UPDATE users SET last_active_at = ? WHERE id = ?`,
          ).bind(now, user.id),
          env.DB.prepare(
            `UPDATE wallets SET last_seen_at = ? WHERE id = ?`,
          ).bind(now, wallet.id),
        ]);

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            referralCode: user.referral_code,
            country: user.country,
            status: user.status,
            createdAt: user.created_at,
          },
          wallet: {
            address: getAddress(wallet.address),
            chainId: wallet.chain_id,
            isPrimary: wallet.is_primary === 1,
          },
          session: {
            expiresAt: session.expires_at,
          },
        });
      } catch (error) {
        console.error("Auth session restore failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to restore authentication session." },
          500,
        );
      }
    }

    // =========================================================
    // ADMIN ANALYTICS
    // =========================================================

    if (request.method === "GET" && url.pathname === "/admin/overview") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin) {
          return jsonResponse(
            request,
            { success: false, authenticated: true, authorized: false },
            403,
          );
        }

        const now = Date.now();
        const startOfTodayUtc = new Date(now);
        startOfTodayUtc.setUTCHours(0, 0, 0, 0);
        const todayCutoff = startOfTodayUtc.getTime();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const [
          totalUsers,
          newUsersToday,
          newUsers7d,
          newUsers30d,
          activeUsers7d,
          activeUsers30d,
          totalWallets,
          genesisHolders,
          genesisPasses,
          tierDistributionResult,
        ] = await Promise.all([
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users`).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(todayCutoff).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(sevenDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(thirtyDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE last_active_at >= ?`)
            .bind(sevenDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE last_active_at >= ?`)
            .bind(thirtyDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM wallets WHERE status != 'blocked'`)
            .first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM genesis_ownership WHERE balance > 0`)
            .first<CountRow>(),
          env.DB.prepare(`SELECT COALESCE(SUM(balance), 0) AS total FROM genesis_ownership WHERE balance > 0`)
            .first<SumRow>(),
          env.DB.prepare(
            `SELECT tier_key, tier_name, COUNT(*) AS holders, COALESCE(SUM(balance), 0) AS passes
             FROM genesis_ownership
             WHERE balance > 0
             GROUP BY tier_key, tier_name
             ORDER BY MIN(balance) ASC`,
          ).all<TierDistributionRow>(),
        ]);

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          authorized: true,
          admin: {
            role: admin.role,
          },
          generatedAt: now,
          periods: {
            todayTimezone: "UTC",
            sevenDays: "rolling",
            thirtyDays: "rolling",
          },
          users: {
            total: totalUsers?.count ?? 0,
            newToday: newUsersToday?.count ?? 0,
            new7d: newUsers7d?.count ?? 0,
            new30d: newUsers30d?.count ?? 0,
            active7d: activeUsers7d?.count ?? 0,
            active30d: activeUsers30d?.count ?? 0,
          },
          wallets: {
            total: totalWallets?.count ?? 0,
          },
          genesis: {
            holders: genesisHolders?.count ?? 0,
            passes: genesisPasses?.total ?? 0,
            tierDistribution: tierDistributionResult.results ?? [],
          },
        });
      } catch (error) {
        console.error("Admin overview failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to load admin overview." },
          500,
        );
      }
    }

    // =========================================================
    // GENESIS OWNERSHIP
    // =========================================================

    if (request.method === "GET" && url.pathname === "/genesis/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const ownership = await getGenesisOwnership(env.DB, auth.user.id);
        return jsonResponse(request, {
          success: true,
          authenticated: true,
          genesis: ownership ? serializeGenesisOwnership(ownership) : null,
        });
      } catch (error) {
        console.error("Genesis ownership read failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to read Genesis ownership." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/genesis/sync") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const now = Date.now();
        const existing = await getGenesisOwnership(env.DB, auth.user.id);
        if (existing && now - existing.synced_at < GENESIS_SYNC_COOLDOWN_MS) {
          return jsonResponse(request, {
            success: true,
            authenticated: true,
            cached: true,
            genesis: serializeGenesisOwnership(existing),
          });
        }

        const client = createPublicClient({ transport: http(env.BNB_RPC_URL) });
        const walletAddress = getAddress(auth.wallet.address);
        const onchainBalance = await client.readContract({
          address: GENESIS_CONTRACT_ADDRESS,
          abi: GENESIS_ABI,
          functionName: "balanceOf",
          args: [walletAddress, GENESIS_PASS_ID],
        });

        const balance = Number(onchainBalance);
        if (!Number.isSafeInteger(balance) || balance < 0) {
          throw new Error("Invalid Genesis balance returned by RPC.");
        }

        const tier = getGenesisTier(balance);
        const createdAt = existing?.created_at ?? now;
        const normalizedWallet = walletAddress.toLowerCase();
        const normalizedContract = GENESIS_CONTRACT_ADDRESS.toLowerCase();

        await env.DB.prepare(
          `INSERT INTO genesis_ownership (
             user_id, wallet_address, chain_id, contract_address, token_id,
             balance, tier_key, tier_name, xp_boost_percent, referral_boost_percent,
             synced_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             wallet_address = excluded.wallet_address,
             chain_id = excluded.chain_id,
             contract_address = excluded.contract_address,
             token_id = excluded.token_id,
             balance = excluded.balance,
             tier_key = excluded.tier_key,
             tier_name = excluded.tier_name,
             xp_boost_percent = excluded.xp_boost_percent,
             referral_boost_percent = excluded.referral_boost_percent,
             synced_at = excluded.synced_at,
             updated_at = excluded.updated_at`,
        ).bind(
          auth.user.id, normalizedWallet, AUTH_CHAIN_ID, normalizedContract,
          GENESIS_PASS_ID.toString(), balance, tier.key, tier.name, tier.xpBoost,
          tier.referralBoost, now, createdAt, now,
        ).run();

        const ownership = await getGenesisOwnership(env.DB, auth.user.id);
        if (!ownership) throw new Error("Genesis ownership snapshot was not saved.");

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          cached: false,
          genesis: serializeGenesisOwnership(ownership),
        });
      } catch (error) {
        console.error("Genesis ownership sync failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to sync Genesis ownership right now." },
          502,
        );
      }
    }

    // =========================================================

    // AUTH LOGOUT

    // =========================================================

    if (request.method === "POST" && url.pathname === "/auth/logout") {
      try {
        const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
        const now = Date.now();

        if (sessionToken) {
          const tokenHash = await sha256(sessionToken);
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE token_hash = ? AND status = 'active'`,
          )
            .bind(now, tokenHash)
            .run();
        }

        return jsonResponse(
          request,
          { success: true, authenticated: false },
          200,
          { "Set-Cookie": buildExpiredSessionCookie(request) },
        );
      } catch (error) {
        console.error("Auth logout failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to log out." },
          500,
        );
      }
    }

    // =========================================================

    // NOT FOUND

    // =========================================================



    return jsonResponse(

      request,

      {

        success: false,

        error: "Not Found",

      },

      404,

    );

  },

};