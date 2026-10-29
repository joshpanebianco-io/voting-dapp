import { useState } from "react";
import { ArrowTopRightOnSquareIcon, WalletIcon } from "@heroicons/react/24/outline";
import { CHAIN, FAUCET_URL, LINKS } from "../../config";
import { useToast } from "../../context/ToastContext";
import { useWallet } from "../../context/WalletContext";
import { describeError } from "../../lib/errors";
import { formatEth, shortAddress } from "../../lib/format";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function WalletModals() {
  const wallet = useWallet();
  return (
    <>
      <WalletPickerModal open={wallet.pickerOpen} onClose={() => wallet.setPickerOpen(false)} />
      <NoWalletModal open={wallet.noWalletOpen} onClose={() => wallet.setNoWalletOpen(false)} />
      <FaucetModal open={wallet.faucetOpen} onClose={() => wallet.setFaucetOpen(false)} />
    </>
  );
}

function WalletPickerModal({ open, onClose }) {
  const { wallets, connectWith, isConnecting } = useWallet();
  return (
    <Modal open={open} onClose={onClose} title="Choose a wallet" description="Several browser wallets were detected.">
      <ul className="space-y-2">
        {wallets.map((entry) => (
          <li key={entry.info.rdns}>
            <button
              type="button"
              onClick={() => connectWith(entry)}
              disabled={isConnecting}
              className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface-2"
            >
              {entry.info.icon ? (
                <img src={entry.info.icon} alt="" className="h-8 w-8 rounded-lg" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <WalletIcon className="h-5 w-5" />
                </span>
              )}
              <span className="font-medium">{entry.info.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function NoWalletModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="No wallet detected"
      description="DecentraVote needs a browser wallet such as MetaMask to sign transactions."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button href={LINKS.metamask} rightIcon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}>
            Install MetaMask
          </Button>
        </>
      }
    >
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
        <li>Install the MetaMask extension and create or import a wallet.</li>
        <li>Switch MetaMask to the {CHAIN.name} test network.</li>
        <li>Reload this page and click “Connect wallet”.</li>
      </ol>
      <p className="mt-4 text-sm text-muted">
        On a phone, open this site inside the MetaMask app&apos;s built-in browser.
      </p>
    </Modal>
  );
}

function FaucetModal({ open, onClose }) {
  const { account, balance, refreshBalance } = useWallet();
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);

  const requestFromAppFaucet = async () => {
    setRequesting(true);
    try {
      const response = await fetch(FAUCET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Faucet responded with ${response.status}`);
      toast.success("Test ETH on its way", {
        description: data.txHash ? `Transaction ${shortAddress(data.txHash, 6)} submitted.` : "The faucet accepted your request.",
      });
      setTimeout(refreshBalance, 8000);
      onClose();
    } catch (err) {
      toast.error("Faucet request failed", { description: describeError(err) });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Get ${CHAIN.name} test ${CHAIN.currency.symbol}`}
      description="Every transaction costs a small amount of gas. Test ETH has no real value and is free from public faucets."
    >
      <div className="rounded-xl bg-surface-2 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Your address</span>
          <span className="font-mono">{shortAddress(account, 6)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-muted">Current balance</span>
          <span className="font-semibold tabular-nums">{formatEth(balance)}</span>
        </div>
      </div>

      {FAUCET_URL && (
        <Button className="mt-4 w-full" onClick={requestFromAppFaucet} loading={requesting}>
          Request from the DecentraVote faucet
        </Button>
      )}

      {CHAIN.faucets.length > 0 && (
        <>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Public faucets</p>
          <ul className="divide-y divide-edge rounded-xl border border-edge">
            {CHAIN.faucets.map((faucet) => (
              <li key={faucet.url}>
                <a
                  href={faucet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
                >
                  {faucet.name}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
