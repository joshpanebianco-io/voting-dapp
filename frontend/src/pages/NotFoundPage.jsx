import { MapIcon } from "@heroicons/react/24/outline";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <EmptyState
      icon={MapIcon}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={<Button to="/">Back to home</Button>}
      className="py-24"
    />
  );
}
