import { useCallback, useState } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import { describeError, isUserRejection } from "../lib/errors";
import { explorerUrl } from "../lib/format";

const IDLE = { status: "idle", hash: null, error: null };

/**
 * Runs a contract write with consistent wallet-prompt / pending / confirmed
 * feedback. `send` must return the ethers TransactionResponse.
 */
export function useTransaction() {
  const toast = useToast();
  const { refreshBalance } = useWallet();
  const [state, setState] = useState(IDLE);

  const run = useCallback(
    async (send, { pending = "Transaction submitted", success = "Transaction confirmed", onSuccess } = {}) => {
      setState({ status: "signing", hash: null, error: null });
      const toastId = toast.pending("Confirm in your wallet", {
        description: "Approve the transaction in your wallet to continue.",
      });

      try {
        const tx = await send();
        const link = explorerUrl("tx", tx.hash);
        const action = link ? { label: "View on Etherscan", href: link } : null;

        setState({ status: "pending", hash: tx.hash, error: null });
        toast.update(toastId, { title: pending, description: "Waiting for the network to confirm…", action });

        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) throw new Error("The transaction was reverted by the network.");

        setState({ status: "success", hash: tx.hash, error: null });
        toast.update(toastId, { variant: "success", title: success, description: null, duration: 6000, action });
        refreshBalance();
        await onSuccess?.(receipt);
        return receipt;
      } catch (err) {
        const message = describeError(err);
        setState({ status: "error", hash: null, error: message });
        if (isUserRejection(err)) {
          toast.dismiss(toastId);
        } else {
          console.error("Transaction failed", err);
          toast.update(toastId, {
            variant: "error",
            title: "Transaction failed",
            description: message,
            duration: 9000,
            action: null,
          });
        }
        return null;
      }
    },
    [toast, refreshBalance],
  );

  const reset = useCallback(() => setState(IDLE), []);

  return {
    ...state,
    run,
    reset,
    busy: state.status === "signing" || state.status === "pending",
  };
}
