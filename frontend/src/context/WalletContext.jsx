import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, formatEther, getAddress } from "ethers";
import { CHAIN, CHAIN_ID, LOW_BALANCE_ETH } from "../config";
import { getReadProvider } from "../lib/contracts";
import { describeError, isUserRejection } from "../lib/errors";
import {
  findWallet,
  getWallets,
  isMobileDevice,
  metamaskDeepLink,
  startWalletDiscovery,
  subscribeWallets,
} from "../lib/wallets";
import { readStorage, writeStorage } from "../hooks/useLocalStorage";
import { useToast } from "./ToastContext";

const WalletContext = createContext(null);
const STORAGE_KEY = "dv.wallet";
const BALANCE_REFRESH_MS = 30_000;

export function WalletProvider({ children }) {
  const toast = useToast();

  const [wallets, setWallets] = useState(() => getWallets());
  const [wallet, setWallet] = useState(null); // { info, provider }
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected
  const [balance, setBalance] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noWalletOpen, setNoWalletOpen] = useState(false);
  const [faucetOpen, setFaucetOpen] = useState(false);

  // ------------------------------------------------------------------ discovery
  useEffect(() => {
    startWalletDiscovery();
    const unsubscribe = subscribeWallets(setWallets);
    setWallets(getWallets());
    return unsubscribe;
  }, []);

  // A fresh BrowserProvider per wallet + chain, so a chain switch never leaves
  // us holding a provider bound to the old network.
  const browserProvider = useMemo(
    () => (wallet ? new BrowserProvider(wallet.provider) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet, chainId],
  );

  const reset = useCallback(() => {
    setWallet(null);
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setStatus("disconnected");
    writeStorage(STORAGE_KEY, null);
  }, []);

  const adopt = useCallback((entry, accounts, hexChainId) => {
    setWallet(entry);
    setAccount(getAddress(accounts[0]));
    setChainId(parseInt(hexChainId, 16));
    setStatus("connected");
    writeStorage(STORAGE_KEY, entry.info.rdns);
  }, []);

  // ------------------------------------------------------------------ connect
  const connectWith = useCallback(
    async (entry) => {
      setPickerOpen(false);
      setStatus("connecting");
      try {
        const accounts = await entry.provider.request({ method: "eth_requestAccounts" });
        if (!accounts?.length) throw new Error("No accounts were returned by the wallet.");
        const hexChainId = await entry.provider.request({ method: "eth_chainId" });
        adopt(entry, accounts, hexChainId);
        return true;
      } catch (err) {
        setStatus(account ? "connected" : "disconnected");
        if (!isUserRejection(err)) {
          toast.error("Could not connect wallet", { description: describeError(err) });
        }
        return false;
      }
    },
    [account, adopt, toast],
  );

  const connect = useCallback(async () => {
    const available = getWallets();
    if (available.length === 0) {
      if (isMobileDevice()) {
        window.location.href = metamaskDeepLink();
        return false;
      }
      setNoWalletOpen(true);
      return false;
    }
    if (available.length === 1) return connectWith(available[0]);
    setPickerOpen(true);
    return false;
  }, [connectWith]);

  const disconnect = useCallback(async () => {
    const provider = wallet?.provider;
    reset();
    try {
      await provider?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      /* not supported by every wallet; local state is already cleared */
    }
  }, [wallet, reset]);

  // Silent reconnect to the wallet used last time (no popup).
  const reconnectAttempted = useRef(false);
  useEffect(() => {
    if (reconnectAttempted.current || wallet) return;
    const rdns = readStorage(STORAGE_KEY, null);
    if (!rdns) {
      reconnectAttempted.current = true;
      return;
    }
    const entry = findWallet(rdns);
    if (!entry) return; // wallet not announced yet; effect re-runs when `wallets` changes
    reconnectAttempted.current = true;

    (async () => {
      try {
        const accounts = await entry.provider.request({ method: "eth_accounts" });
        if (accounts?.length) {
          const hexChainId = await entry.provider.request({ method: "eth_chainId" });
          adopt(entry, accounts, hexChainId);
        } else {
          writeStorage(STORAGE_KEY, null);
        }
      } catch {
        writeStorage(STORAGE_KEY, null);
      }
    })();
  }, [wallets, wallet, adopt]);

  // ------------------------------------------------------------------ wallet events
  useEffect(() => {
    const provider = wallet?.provider;
    if (!provider?.on) return undefined;

    const onAccountsChanged = (accounts) => {
      if (!accounts?.length) reset();
      else setAccount(getAddress(accounts[0]));
    };
    const onChainChanged = (hexChainId) => setChainId(parseInt(hexChainId, 16));
    const onDisconnect = () => reset();

    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);
    provider.on("disconnect", onDisconnect);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
      provider.removeListener?.("disconnect", onDisconnect);
    };
  }, [wallet, reset]);

  // ------------------------------------------------------------------ balance
  const refreshBalance = useCallback(async () => {
    if (!account) {
      setBalance(null);
      return;
    }
    try {
      setBalance(await getReadProvider().getBalance(account));
    } catch {
      /* keep the previous value */
    }
  }, [account]);

  useEffect(() => {
    refreshBalance();
    const timer = setInterval(refreshBalance, BALANCE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refreshBalance]);

  // ------------------------------------------------------------------ network
  const switchNetwork = useCallback(async () => {
    if (!wallet) return false;
    setSwitching(true);
    try {
      await wallet.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN.hexId }],
      });
      return true;
    } catch (err) {
      const unknownChain = err?.code === 4902 || /unrecognized chain|not been added/i.test(err?.message || "");
      if (unknownChain) {
        try {
          await wallet.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CHAIN.hexId,
                chainName: CHAIN.name,
                rpcUrls: CHAIN.rpcUrls,
                nativeCurrency: CHAIN.currency,
                blockExplorerUrls: CHAIN.explorer ? [CHAIN.explorer] : [],
              },
            ],
          });
          return true;
        } catch (addErr) {
          if (!isUserRejection(addErr)) {
            toast.error(`Could not add ${CHAIN.name}`, { description: describeError(addErr) });
          }
        }
      } else if (!isUserRejection(err)) {
        toast.error("Could not switch network", { description: describeError(err) });
      }
      return false;
    } finally {
      setSwitching(false);
    }
  }, [wallet, toast]);

  const getSigner = useCallback(async () => {
    if (!browserProvider || !account) throw new Error("Connect a wallet first.");
    return browserProvider.getSigner(account);
  }, [browserProvider, account]);

  // ------------------------------------------------------------------ value
  const isConnected = status === "connected" && Boolean(account);
  const isCorrectNetwork = chainId === CHAIN_ID;
  const lowBalance = balance != null && Number(formatEther(balance)) < LOW_BALANCE_ETH;

  const value = useMemo(
    () => ({
      wallets,
      wallet,
      account,
      chainId,
      status,
      isConnected,
      isConnecting: status === "connecting",
      isCorrectNetwork,
      canTransact: isConnected && isCorrectNetwork,
      balance,
      lowBalance,
      connect,
      connectWith,
      disconnect,
      switchNetwork,
      switching,
      getSigner,
      refreshBalance,
      pickerOpen,
      setPickerOpen,
      noWalletOpen,
      setNoWalletOpen,
      faucetOpen,
      setFaucetOpen,
    }),
    [
      wallets,
      wallet,
      account,
      chainId,
      status,
      isConnected,
      isCorrectNetwork,
      balance,
      lowBalance,
      connect,
      connectWith,
      disconnect,
      switchNetwork,
      switching,
      getSigner,
      refreshBalance,
      pickerOpen,
      noWalletOpen,
      faucetOpen,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
