import { leadingOptions } from "../../lib/polls";
import { ResultBar } from "./ResultBar";

/** The full tally for a poll. */
export function PollResults({ poll, open, votedOption = null, compact = false, limit, className }) {
  const leaders = leadingOptions(poll);
  const options = limit ? poll.options.slice(0, limit) : poll.options;
  const hidden = poll.options.length - options.length;

  return (
    <div className={className}>
      <div className={compact ? "space-y-2.5" : "space-y-4"}>
        {options.map((label, index) => (
          <ResultBar
            key={index}
            label={label}
            count={poll.voteCounts[index]}
            total={poll.totalVotes}
            leading={open && leaders.includes(index) && leaders.length === 1}
            winner={!open && leaders.includes(index)}
            mine={votedOption === index}
            compact={compact}
          />
        ))}
      </div>
      {hidden > 0 && (
        <p className="mt-2.5 text-xs text-muted">
          + {hidden} more {hidden === 1 ? "option" : "options"}
        </p>
      )}
    </div>
  );
}
