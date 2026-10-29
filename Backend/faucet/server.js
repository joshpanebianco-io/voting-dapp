/**
 * Minimal testnet faucet for DecentraVote.
 *
 * The original app shipped the funding wallet's private key inside the browser
 * bundle, which let anyone drain it. This service keeps the key on a server and
 * sends a small, rate-limited amount of test ETH to an address on request.
 *
 *   FAUCET_PRIVATE_KEY=0x... RPC_URL=https://... node faucet/server.js
 *
 * Then set VITE_FAUCET_URL=https://<host>/fund in frontend/.env.
 *
 * Environment:
 *   FAUCET_PRIVATE_KEY        required, the funding wallet
 *   RPC_URL                   Sepolia RPC (default: public node)
 *   PORT                      default 8787
 *   AMOUNT_ETH                default 0.005
 *   COOLDOWN_HOURS            per address, default 24
 *   MAX_RECIPIENT_BALANCE_ETH refuse if recipient already holds more, default 0.01
 *   ALLOWED_ORIGIN            CORS origin, default * (set to your site in production)
 */
const http = require("node:http");
const { ethers } = require("ethers");

const {
  FAUCET_PRIVATE_KEY,
  RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com",
  PORT = "8787",
  AMOUNT_ETH = "0.005",
  COOLDOWN_HOURS = "24",
  MAX_RECIPIENT_BALANCE_ETH = "0.01",
  ALLOWED_ORIGIN = "*",
} = process.env;

if (!FAUCET_PRIVATE_KEY) {
  console.error("FAUCET_PRIVATE_KEY is required");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);
const amount = ethers.parseEther(AMOUNT_ETH);
const maxRecipientBalance = ethers.parseEther(MAX_RECIPIENT_BALANCE_ETH);
const cooldownMs = Number(COOLDOWN_HOURS) * 60 * 60 * 1000;

/** address -> timestamp of last payout (in-memory; restarting resets it). */
const lastPayout = new Map();
let queue = Promise.resolve();

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

async function fund(address) {
  const now = Date.now();
  const last = lastPayout.get(address) || 0;
  if (now - last < cooldownMs) {
    const hours = Math.ceil((cooldownMs - (now - last)) / 3_600_000);
    throw Object.assign(new Error(`This address was funded recently. Try again in about ${hours}h.`), { status: 429 });
  }

  const recipientBalance = await provider.getBalance(address);
  if (recipientBalance >= maxRecipientBalance) {
    throw Object.assign(new Error(`This address already holds at least ${MAX_RECIPIENT_BALANCE_ETH} ETH.`), { status: 400 });
  }

  const faucetBalance = await provider.getBalance(wallet.address);
  if (faucetBalance < amount * 2n) {
    throw Object.assign(new Error("The faucet is running dry. Please use a public faucet."), { status: 503 });
  }

  lastPayout.set(address, now);
  const tx = await wallet.sendTransaction({ to: address, value: amount });
  console.log(`${new Date().toISOString()} sent ${AMOUNT_ETH} ETH to ${address}: ${tx.hash}`);
  return tx.hash;
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, faucet: wallet.address });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1024) req.destroy();
  });
  req.on("end", () => {
    let address;
    try {
      address = ethers.getAddress(JSON.parse(body || "{}").address);
    } catch {
      return json(res, 400, { error: "A valid address is required." });
    }

    // Serialise payouts so the nonce never collides.
    queue = queue
      .then(() => fund(address))
      .then((txHash) => json(res, 200, { ok: true, txHash, amount: AMOUNT_ETH }))
      .catch((err) => {
        console.error(err.message);
        json(res, err.status || 500, { error: err.status ? err.message : "Faucet error. Please try again later." });
      });
    return undefined;
  });
});

server.listen(Number(PORT), () => {
  console.log(`Faucet ${wallet.address} listening on :${PORT} (amount ${AMOUNT_ETH} ETH, cooldown ${COOLDOWN_HOURS}h)`);
});
