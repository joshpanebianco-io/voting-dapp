import { useNow } from "../../hooks/useNow";
import { isPollOpen } from "../../lib/polls";
import { Badge } from "../ui/Badge";

const ENDING_SOON_SECONDS = 60 * 60;

export function PollStatusBadge({ poll, size = "sm", className }) {
  const now = useNow();
  const remaining = poll.endTime - now;

  if (!isPollOpen(poll, now)) {
    return (
      <Badge variant="neutral" dot size={size} className={className}>
        Closed
      </Badge>
    );
  }
  if (remaining <= ENDING_SOON_SECONDS) {
    return (
      <Badge variant="warning" dot pulse size={size} className={className}>
        Ending soon
      </Badge>
    );
  }
  return (
    <Badge variant="success" dot pulse size={size} className={className}>
      Active
    </Badge>
  );
}
