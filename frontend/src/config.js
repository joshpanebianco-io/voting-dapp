const env = import.meta.env;

export const APP_NAME = "DecentraVote";
export const APP_TAGLINE = "Transparent polls. Verifiable votes.";

/** Chains the app knows how to talk to. */
export const CHAINS = {
  11155111: {
    id: 11155111,
    name: "Sepolia",
    hexId: "0xaa36a7",
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    explorer: "https://sepolia.etherscan.io",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
    faucets: [
      { name: "Google Cloud Web3 faucet", url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia" },
      { name: "Alchemy Sepolia faucet", url: "https://www.alchemy.com/faucets/ethereum-sepolia" },
      { name: "Infura Sepolia faucet", url: "https://www.infura.io/faucet/sepolia" },
      { name: "Chainlink faucet", url: "https://faucets.chain.link/sepolia" },
    ],
    defaultAddresses: {
      pollManager: "0xEFCCF9B71bBa10562899b3Ad858bad6e2F83B86f",
      pollRetriever: "0xeD3031Bf2d6d88dEa275F4E4d1b807c7872273c1",
    },
  },
  31337: {
    id: 31337,
    name: "Hardhat (local)",
    hexId: "0x7a69",
    rpcUrls: ["http://127.0.0.1:8545"],
    explorer: null,
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
    faucets: [],
    defaultAddresses: {},
  },
};

export const CHAIN_ID = Number(env.VITE_CHAIN_ID || 11155111);
export const CHAIN = CHAINS[CHAIN_ID] || {
  id: CHAIN_ID,
  name: `Chain ${CHAIN_ID}`,
  hexId: `0x${CHAIN_ID.toString(16)}`,
  rpcUrls: [],
  explorer: null,
  currency: { name: "Ether", symbol: "ETH", decimals: 18 },
  testnet: true,
  faucets: [],
  defaultAddresses: {},
};

export const RPC_URL = env.VITE_RPC_PROVIDER_URL || CHAIN.rpcUrls[0] || "";

export const ADDRESSES = {
  pollManager: env.VITE_POLLMANAGER_CONTRACT_ADDRESS || CHAIN.defaultAddresses.pollManager || "",
  pollRetriever: env.VITE_POLLRETRIEVER_CONTRACT_ADDRESS || CHAIN.defaultAddresses.pollRetriever || "",
};

export const FAUCET_URL = env.VITE_FAUCET_URL || "";

export const IS_CONFIGURED = Boolean(RPC_URL && ADDRESSES.pollManager && ADDRESSES.pollRetriever);

/** Poll creation limits, mirrored from PollManager.sol. */
export const LIMITS = {
  minOptions: 2,
  maxOptions: 10,
  maxNameLength: 120,
  maxOptionLength: 80,
  minDurationMinutes: 1,
  maxDurationMinutes: 365 * 24 * 60,
};

export const POLLS_PER_PAGE = 9;
export const REFRESH_INTERVAL_MS = 30_000;

/** Balance (in ETH) below which we nudge the user towards a faucet. */
export const LOW_BALANCE_ETH = 0.002;

export const LINKS = {
  repo: "https://github.com/joshpanebianco-io/voting-dapp",
  metamask: "https://metamask.io/download/",
};

/** Human-readable names for chain ids a wallet might be on. */
export const KNOWN_CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  10: "Optimism",
  56: "BNB Smart Chain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum One",
  11155111: "Sepolia",
  31337: "Hardhat",
  17000: "Holesky",
  560048: "Hoodi",
};

export function chainName(chainId) {
  if (chainId == null) return "Unknown network";
  return KNOWN_CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}
