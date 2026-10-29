import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { CHAIN, IS_CONFIGURED, chainName } from "../../config";
import { useWallet } from "../../context/WalletContext";
import { Button } from "../ui/Button";

export function NetworkBanner() {
  const { isConnected, isCorrectNetwork, chainId, switchNetwork, switching } = useWallet();
  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="border-b border-warning/30 bg-warning/10" role="alert" data-testid="network-banner">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="flex items-start gap-2">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            Your wallet is on <strong>{chainName(chainId)}</strong>. Switch to <strong>{CHAIN.name}</strong> to register and
            vote. Browsing works on any network.
          </span>
        </p>
        <Button size="sm" onClick={switchNetwork} loading={switching} className="shrink-0">
          Switch to {CHAIN.name}
        </Button>
      </div>
    </div>
  );
}

export function ConfigBanner() {
  if (IS_CONFIGURED) return null;
  return (
    <div className="border-b border-danger/30 bg-danger/10 text-sm" role="alert">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <span>
          Missing contract configuration. Copy <code className="font-mono">frontend/.env.example</code> to{" "}
          <code className="font-mono">frontend/.env</code> and fill in the RPC URL and contract addresses.
        </span>
      </div>
    </div>
  );
}
