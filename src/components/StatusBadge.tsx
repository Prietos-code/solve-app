import { STATUS_LABEL, STATUS_TONE, type TaskStatus } from "@/lib/categories";

const TONE_CLASS: Record<string, string> = {
  primary: "border-primary/30 bg-paper-warm text-primary",
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
  success: "border-success/35 bg-success/10 text-success",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-stone bg-paper-warm text-oak-soft",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${TONE_CLASS[tone]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
