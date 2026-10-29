import { useState } from "react";
import { CheckCircleIcon, CheckIcon, LockClosedIcon, TicketIcon, WalletIcon } from "@heroicons/react/20/solid";
import { CHAIN } from "../../config";
import { usePolls } from "../../context/PollsContext";
import { useWallet } from "../../context/WalletContext";
import { useNow } from "../../hooks/useNow";
import { useTransaction } from "../../hooks/useTransaction";
import { cn } from "../../lib/cn";
import { getPollManager } from "../../lib/contracts";
import { isPollOpen } from "../../lib/polls";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

/**
 * The action card on a poll page: connect -> register (mint ballot) -> vote.
 * `status` is the connected account's { participated, voted, votedOption }.
 */
export function VotePanel({ poll, status, className }) {
  const wallet = useWallet();
  const { applyRegistration, applyVote, refresh } = usePolls();
  const now = useNow();
  const tx = useTransaction();
  const [selected, setSelected] = useState(null);

  const open = isPollOpen(poll, now);
  const connected = wallet.isConnected;
  const registered = Boolean(status?.participated);
  const voted = Boolean(status?.voted);
  const votedOption = status?.votedOption ?? null;
  const statusKnown = !connected || status !== undefined;

  const register = () =>
    tx.run(
      async () => {
        const manager = getPollManager(await wallet.getSigner());
        return manager.participate(poll.id);
      },
      {
        pending: "Issuing your ballot…",
        success: "You're registered. Your ballot NFT has been issued.",
        onSuccess: () => {
          applyRegistration(poll.id);
          refresh();
        },
      },
    );

  const castVote = () => {
    if (selected == null) return;
    const choice = selected;
    return tx.run(
      async () => {
        const manager = getPollManager(await wallet.getSigner());
        return manager.vote(poll.id, choice);
      },
      {
        pending: "Recording your vote…",
        success: "Vote recorded. Your ballot has been burned.",
        onSuccess: () => {
          applyVote(poll.id, choice);
          refresh();
        },
      },
    );
  };

  const steps = [
    { label: "Connect wallet", done: connected, icon: WalletIcon },
    { label: "Register (mint ballot)", done: registered || voted, icon: TicketIcon },
    { label: "Cast vote (burn ballot)", done: voted, icon: CheckCircleIcon },
  ];

  return (
    <Card className={cn("flex flex-col", className)} data-testid="vote-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{open ? "Take part" : "Voting closed"}</h2>
        {!open && <LockClosedIcon className="h-4 w-4 text-muted" />}
      </div>

      <ol className="mt-4 space-y-2.5" aria-label="Voting steps">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                step.done ? "border-success bg-success text-white" : "border-edge bg-surface-2 text-muted",
              )}
              aria-hidden="true"
            >
              {step.done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={step.done ? "text-fg" : "text-muted"}>{step.label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t border-edge pt-5">
        {!open ? (
          <ClosedState voted={voted} option={votedOption != null ? poll.options[votedOption] : null} />
        ) : !connected ? (
          <>
            <p className="text-sm text-muted">Connect a wallet to register for this poll and cast a vote.</p>
            <Button className="mt-4 w-full" onClick={wallet.connect} loading={wallet.isConnecting}>
              Connect wallet
            </Button>
          </>
        ) : !wallet.isCorrectNetwork ? (
          <>
            <p className="text-sm text-muted">Your wallet is on the wrong network. Switch to {CHAIN.name} to continue.</p>
            <Button className="mt-4 w-full" onClick={wallet.switchNetwork} loading={wallet.switching}>
              Switch to {CHAIN.name}
            </Button>
          </>
        ) : !statusKnown ? (
          <p className="text-sm text-muted">Checking your eligibility…</p>
        ) : voted ? (
          <ClosedState voted option={votedOption != null ? poll.options[votedOption] : null} live />
        ) : !registered ? (
          <>
            <p className="text-sm text-muted">
              Registering issues a non-transferable ballot NFT to your wallet. It is burned the moment you vote, so every
              registered address votes exactly once.
            </p>
            <Button className="mt-4 w-full" onClick={register} loading={tx.busy} data-testid="register-button">
              {tx.status === "signing" ? "Confirm in wallet…" : tx.status === "pending" ? "Issuing ballot…" : "Register to vote"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Choose an option</p>
            <fieldset className="mt-3 space-y-2" disabled={tx.busy}>
              <legend className="sr-only">Poll options</legend>
              {poll.options.map((option, index) => {
                const checked = selected === index;
                return (
                  <label
                    key={index}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      checked ? "border-accent bg-accent/10" : "border-edge hover:border-muted/50 hover:bg-surface-2",
                    )}
                  >
                    <input
                      type="radio"
                      name={`poll-${poll.id}-option`}
                      value={index}
                      checked={checked}
                      onChange={() => setSelected(index)}
                      className="h-4 w-4 accent-[rgb(var(--c-accent))]"
                    />
                    <span className="min-w-0 flex-1 break-words font-medium">{option}</span>
                  </label>
                );
              })}
            </fieldset>
            <Button
              className="mt-4 w-full"
              onClick={castVote}
              disabled={selected == null}
              loading={tx.busy}
              data-testid="vote-button"
            >
              {tx.status === "signing" ? "Confirm in wallet…" : tx.status === "pending" ? "Recording vote…" : "Cast vote"}
            </Button>
            <p className="mt-3 text-xs text-muted">Votes are final and recorded publicly on {CHAIN.name}.</p>
          </>
        )}

        {tx.status === "error" && tx.error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {tx.error}
          </p>
        )}

        {open && connected && wallet.isCorrectNetwork && wallet.lowBalance && !voted && (
          <p className="mt-3 text-xs text-warning">
            Your balance looks too low to pay for gas.{" "}
            <button type="button" className="font-medium underline" onClick={() => wallet.setFaucetOpen(true)}>
              Get test {CHAIN.currency.symbol}
            </button>
          </p>
        )}
      </div>
    </Card>
  );
}

function ClosedState({ voted, option, live = false }) {
  if (voted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4" data-testid="voted-state">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircleIcon className="h-5 w-5" />
          {live ? "Your vote has been recorded" : "You voted in this poll"}
        </p>
        {option && (
          <p className="mt-1 text-sm">
            You chose <span className="font-semibold">{option}</span>.
          </p>
        )}
        <p className="mt-1 text-xs text-muted">Your ballot NFT was burned when the vote was counted.</p>
      </div>
    );
  }
  return (
    <p className="text-sm text-muted">
      This poll has ended and the tally is final. Registration and voting are no longer possible.
    </p>
  );
}
