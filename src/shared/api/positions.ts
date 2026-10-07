const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface IndexedPosition {
  id: string; chainId: number; productType: "earn" | "stake"; contractKey: string;
  contractAddress: `0x${string}`; positionId: number; poolId: string | null;
  userAddress: `0x${string}`; principalAtomic: string; fundedForWithdrawalAtomic: string;
  status: number; createdAtChain: number | null; lockStartedAtChain: number | null;
  lockEndsAtChain: number | null; withdrawalRequestedAtChain: number | null;
  fundedAtChain: number | null; claimableAtChain: number | null; withdrawnAtChain: number | null;
  firstSeenAt: number; lastSyncedAt: number;
}
export interface IndexedPositionSummary { total:number; earn:number; stake:number; active:number; withdrawalPending:number; withdrawn:number; }
export interface MyPositionsResponse { success:true; authenticated:true; walletAddress:`0x${string}`; chainId:56; summary:IndexedPositionSummary; positions:IndexedPosition[]; }
async function readJson<T>(response:Response):Promise<T>{let data:unknown;try{data=await response.json()}catch{throw new Error("The API returned an invalid response.")}if(!response.ok){const body=data as {error?:string};throw new Error(body?.error||`API request failed with status ${response.status}.`)}return data as T}
export async function getMyPositions():Promise<MyPositionsResponse>{return readJson(await fetch(`${API_BASE_URL}/positions/me`,{method:"GET",credentials:"include",headers:{Accept:"application/json"}}))}
