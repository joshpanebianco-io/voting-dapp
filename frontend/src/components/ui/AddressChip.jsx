import { ArrowTopRightOnSquareIcon, CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/20/solid";
import { useCopy } from "../../hooks/useCopy";
import { cn } from "../../lib/cn";
import { explorerUrl, shortAddress } from "../../lib/format";

/** Deterministic two-colour gradient for an address avatar. */
export function addressGradient(address) {
  if (!address) return "linear-gradient(135deg, #94a3b8, #64748b)";
  const h1 = parseInt(address.slice(2, 8), 16) % 360;
  const h2 = (h1 + 40 + (parseInt(address.slice(8, 14), 16) % 80)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 70% 45%))`;
}

export function AddressAvatar({ address, className }) {
  return (
    <span
      className={cn("inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-black/5", className)}
      style={{ background: addressGradient(address) }}
      aria-hidden="true"
    />
  );
}

export function AddressChip({ address, label, type = "address", avatar = false, chars = 4, copy = true, link = true, className }) {
  const [copied, doCopy] = useCopy();
  if (!address) return null;
  const href = link ? explorerUrl(type, address) : null;

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm", className)}>
      {avatar && <AddressAvatar address={address} className="h-4 w-4" />}
      <span title={address}>{label || shortAddress(address, chars)}</span>
      {copy && (
        <button
          type="button"
          onClick={() => doCopy(address)}
          className="rounded p-0.5 text-muted transition-colors hover:text-fg"
          aria-label={copied ? "Copied" : "Copy address"}
          title={copied ? "Copied" : "Copy address"}
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <DocumentDuplicateIcon className="h-3.5 w-3.5" />}
        </button>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded p-0.5 text-muted transition-colors hover:text-fg"
          aria-label="View on block explorer"
          title="View on block explorer"
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}
