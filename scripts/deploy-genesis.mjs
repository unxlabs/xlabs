import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

const RPC_URL = "https://bsc-dataseed.bnbchain.org";

const USDT = "0x55d398326f99059fF775485246999027B3197955";

const METADATA_URI =
  "ipfs://bafkreibz7p3wgjdhqm4nwjvx4appolir3c3fkzjrxmbeyfurihpbrwgh4a";

if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY missing from .env");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

const wallet = new ethers.Wallet(
  process.env.DEPLOYER_PRIVATE_KEY,
  provider
);

const network = await provider.getNetwork();

if (network.chainId !== 56n) {
  throw new Error(`Wrong network. Expected BNB Chain 56, got ${network.chainId}`);
}

const balance = await provider.getBalance(wallet.address);

console.log("Network: BNB Chain Mainnet (56)");
console.log("Deployer:", wallet.address);
console.log("BNB balance:", ethers.formatEther(balance));

const artifact = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/UnlimitedGenesisPass.sol/UnlimitedGenesisPass.json",
    "utf8"
  )
);

const factory = new ethers.ContractFactory(
  artifact.abi,
  artifact.bytecode,
  wallet
);

console.log("Deploying Unlimited Genesis Pass...");

const contract = await factory.deploy(
  USDT,
  wallet.address,
  METADATA_URI
);

console.log(
  "Deployment transaction:",
  contract.deploymentTransaction().hash
);

await contract.waitForDeployment();

console.log("--------------------------------");
console.log("DEPLOYMENT SUCCESSFUL");
console.log("Contract:", await contract.getAddress());
console.log("Owner:", wallet.address);
console.log("Treasury:", wallet.address);
console.log("Metadata:", METADATA_URI);
console.log("--------------------------------");