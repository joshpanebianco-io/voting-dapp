/**
 * Wallet discovery via EIP-6963 (multi-injected provider discovery), with a
 * fallback to the legacy `window.ethereum` object.
 *
 * Each wallet is `{ info: { uuid, name, icon, rdns }, provider }`.
 */

const discovered = new Map();
const listeners = new Set();
let started = false;

export function startWalletDiscovery() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("eip6963:announceProvider", (event) => {
    const { info, provider } = event.detail || {};
    if (!info || !provider) return;
    discovered.set(info.rdns || info.uuid, { info, provider });
    notify();
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function getWallets() {
  const list = [...discovered.values()];
  if (list.length === 0 && typeof window !== "undefined" && window.ethereum) {
    list.push({
      info: {
        uuid: "legacy",
        rdns: "legacy.injected",
        name: guessWalletName(window.ethereum),
        icon: null,
      },
      provider: window.ethereum,
    });
  }
  return list;
}

export function findWallet(rdns) {
  if (!rdns) return null;
  return getWallets().find((w) => w.info.rdns === rdns) || null;
}

export function subscribeWallets(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const wallets = getWallets();
  listeners.forEach((fn) => fn(wallets));
}

function guessWalletName(provider) {
  if (provider?.isRabby) return "Rabby";
  if (provider?.isBraveWallet) return "Brave Wallet";
  if (provider?.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider?.isTrust) return "Trust Wallet";
  if (provider?.isMetaMask) return "MetaMask";
  return "Browser wallet";
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Deep link that opens the current page inside MetaMask's in-app browser. */
export function metamaskDeepLink() {
  const { host, pathname, search, hash } = window.location;
  return `https://metamask.app.link/dapp/${host}${pathname}${search}${hash}`;
}
