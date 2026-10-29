import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

export function PollListError({ message, onRetry }) {
  return (
    <EmptyState
      icon={ExclamationTriangleIcon}
      title="Couldn't load polls"
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
            Try again
          </Button>
        )
      }
    />
  );
}
