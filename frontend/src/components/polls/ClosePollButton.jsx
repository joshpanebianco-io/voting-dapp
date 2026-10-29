import { useState } from "react";
import { usePolls } from "../../context/PollsContext";
import { useWallet } from "../../context/WalletContext";
import { useTransaction } from "../../hooks/useTransaction";
import { getPollManager } from "../../lib/contracts";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

/** Shown to the poll creator while the poll is open. */
export function ClosePollButton({ poll }) {
  const wallet = useWallet();
  const { applyClose, refresh } = usePolls();
  const tx = useTransaction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const close = async () => {
    setConfirmOpen(false);
    await tx.run(
      async () => {
        const manager = getPollManager(await wallet.getSigner());
        return manager.closePoll(poll.id);
      },
      {
        pending: "Closing poll…",
        success: "Poll closed. Results are now final.",
        onSuccess: () => {
          applyClose(poll.id);
          refresh();
        },
      },
    );
  };

  return (
    <>
      <Button variant="danger-outline" size="sm" onClick={() => setConfirmOpen(true)} loading={tx.busy} data-testid="close-poll-button">
        Close poll early
      </Button>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Close this poll early?"
        description="Voting stops immediately and the current tally becomes the final result. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep it open
            </Button>
            <Button variant="danger" onClick={close} data-testid="confirm-close-poll">
              Close poll
            </Button>
          </>
        }
      />
    </>
  );
}
