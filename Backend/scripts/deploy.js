/**
 * Deploys PollManager (which deploys BallotNFT) and PollRetriever, then:
 *   - writes the ABIs the frontend imports to ../frontend/src/abis/
 *   - records the addresses in ./deployments/<network>.json
 *   - prints the VITE_* lines to paste into ../frontend/.env
 *
 *   npx hardhat run scripts/deploy.js --network sepolia
 *   npx hardhat run scripts/deploy.js --network localhost
 */
const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const { ethers, network, artifacts } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY in Backend/.env for live networks.");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Network:  ${network.name} (chainId ${network.config.chainId ?? (await ethers.provider.getNetwork()).chainId})`);
  console.log(`Deployer: ${deployer.address} (${ethers.formatEther(balance)} ETH)\n`);

  const PollManager = await ethers.getContractFactory("PollManager");
  const manager = await PollManager.deploy();
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  const ballotAddress = await manager.ballot();
  console.log(`PollManager   ${managerAddress}`);
  console.log(`BallotNFT     ${ballotAddress}`);

  const PollRetriever = await ethers.getContractFactory("PollRetriever");
  const retriever = await PollRetriever.deploy(managerAddress);
  await retriever.waitForDeployment();
  const retrieverAddress = await retriever.getAddress();
  console.log(`PollRetriever ${retrieverAddress}\n`);

  // ---- ABIs for the frontend --------------------------------------------
  const abiDir = path.resolve(__dirname, "../../frontend/src/abis");
  fs.mkdirSync(abiDir, { recursive: true });
  for (const name of ["PollManager", "PollRetriever", "BallotNFT"]) {
    const { abi } = await artifacts.readArtifact(name);
    fs.writeFileSync(path.join(abiDir, `${name}.json`), JSON.stringify(abi, null, 2) + "\n");
  }
  console.log(`ABIs written to ${path.relative(process.cwd(), abiDir)}`);

  // ---- deployment record --------------------------------------------------
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const record = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    block: await ethers.provider.getBlockNumber(),
    contracts: { PollManager: managerAddress, BallotNFT: ballotAddress, PollRetriever: retrieverAddress },
  };
  const recordPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + "\n");
  console.log(`Deployment recorded in ${path.relative(process.cwd(), recordPath)}\n`);

  // ---- frontend env -------------------------------------------------------
  console.log("Add these to frontend/.env:\n");
  console.log(`VITE_CHAIN_ID=${chainId}`);
  console.log(`VITE_POLLMANAGER_CONTRACT_ADDRESS=${managerAddress}`);
  console.log(`VITE_POLLRETRIEVER_CONTRACT_ADDRESS=${retrieverAddress}`);

  if (network.name === "sepolia") {
    console.log("\nVerify on Etherscan (optional, needs ETHERSCAN_API_KEY):");
    console.log(`  npx hardhat verify --network sepolia ${managerAddress}`);
    console.log(`  npx hardhat verify --network sepolia ${ballotAddress} ${managerAddress}`);
    console.log(`  npx hardhat verify --network sepolia ${retrieverAddress} ${managerAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
