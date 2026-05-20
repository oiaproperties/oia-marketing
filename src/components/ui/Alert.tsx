import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertType = "info" | "ok" | "err" | "warn";

const ICONS = {
  info: Info,
  ok:   CheckCircle2,
  err:  XCircle,
  warn: AlertCircle,
};

export default function Alert({ type = "info", message }: { type?: AlertType; message: string }) {
  const Icon = ICONS[type];
  return (
    <div className={`db-info db-info-${type}`}>
      <Icon size={16} />
      <span>{message}</span>
    </div>
  );
}
