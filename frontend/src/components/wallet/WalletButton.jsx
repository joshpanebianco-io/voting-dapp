import { useEffect, useRef, useState } from "react";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  CheckIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  WalletIcon,
} from "@heroicons/react/20/solid";
import { CHAIN, chainName } from "../../config";
import { useWallet } from "../../context/WalletContext";
import { useCopy } from "../../hooks/useCopy";
import { cn } from "../../lib/cn";
import { explorerUrl, formatEth, shortAddress } from "../../lib/format";
import { Button } from "../ui/Button";
import { AddressAvatar } from "../ui/AddressChip";

export function WalletButton({ className }) {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const [copied, copy] = useCopy();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!wallet.isConnected) {
    return (
      <Button
        onClick={wallet.connect}
        loading={wallet.isConnecting}
        className={className}
        leftIcon={<WalletIcon className="h-4 w-4" />}
        data-testid="connect-wallet"
      >
        <span className="hidden sm:inline">Connect wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>
    );
  }

  const { account, balance, lowBalance, chainId, isCorrectNetwork } = wallet;
  const addressLink = explorerUrl("address", account);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="wallet-menu-trigger"
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border bg-surface pl-2 pr-2.5 text-sm font-medium shadow-card transition-colors hover:bg-surface-2",
          isCorrectNetwork ? "border-edge" : "border-warning/50",
        )}
      >
        {isCorrectNetwork ? (
          <AddressAvatar address={account} className="h-6 w-6" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
            <ExclamationTriangleIcon className="h-4 w-4" />
          </span>
        )}
        <span className="whitespace-nowrap font-mono">{shortAddress(account)}</span>
        <ChevronDownIcon className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl border border-edge bg-surface p-2 shadow-pop animate-fade-up"
        >
          <div className="flex items-center gap-3 rounded-xl p-3">
            <AddressAvatar address={account} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{wallet.wallet?.info?.name || "Connected wallet"}</p>
              <p className="truncate font-mono text-sm font-medium" title={account}>
                {shortAddress(account, 6)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => copy(account)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Copy address"
                title="Copy address"
              >
                {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
              </button>
              {addressLink && (
                <a
                  href={addressLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  aria-label="View on block explorer"
                  title="View on block explorer"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="mx-1 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-muted">Balance</p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums" data-testid="wallet-balance">
                {formatEth(balance)}
              </p>
              {lowBalance && <p className="mt-0.5 text-xs font-medium text-warning">Low — top up for gas</p>}
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-muted">Network</p>
              <p className={cn("mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold", !isCorrectNetwork && "text-warning")}>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", isCorrectNetwork ? "bg-success" : "bg-warning")} />
                {chainName(chainId)}
              </p>
            </div>
          </div>

          {!isCorrectNetwork && (
            <div className="mx-1 mt-2">
              <Button size="sm" className="w-full" onClick={wallet.switchNetwork} loading={wallet.switching}>
                Switch to {CHAIN.name}
              </Button>
            </div>
          )}

          <div className="my-2 h-px bg-edge" />

          {CHAIN.testnet && (
            <MenuItem
              icon={BeakerIcon}
              label={`Get test ${CHAIN.currency.symbol}`}
              onClick={() => {
                setOpen(false);
                wallet.setFaucetOpen(true);
              }}
            />
          )}
          <MenuItem
            icon={ArrowRightStartOnRectangleIcon}
            label="Disconnect"
            tone="danger"
            onClick={() => {
              setOpen(false);
              wallet.disconnect();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2",
        tone === "danger" ? "text-danger" : "text-fg",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      {label}
    </button>
  );
}
