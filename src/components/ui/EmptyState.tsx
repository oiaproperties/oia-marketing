import { Database } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  sub?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "No data yet",
  sub = "Load data or check your credentials",
  action,
}: EmptyStateProps) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon flex justify-center">
        <Database size={36} />
      </div>
      <div className="db-empty-title">{title}</div>
      <div className="db-empty-sub">{sub}</div>
      {action}
    </div>
  );
}
