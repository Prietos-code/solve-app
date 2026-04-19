import { STATUS_LABEL, STATUS_TONE, type TaskStatus } from "@/lib/categories";

const TONE_CLASS: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/15 text-warning-foreground",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE_CLASS[tone]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
