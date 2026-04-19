interface Props {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function StarRating({ rating, count, size = "sm", showCount = true }: Props) {
  const filled = Math.round(rating);
  const sz = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-1 ${sz}`}>
      <span className="text-warning">
        {"★".repeat(filled)}
        <span className="text-muted-foreground/40">{"★".repeat(5 - filled)}</span>
      </span>
      {showCount && (
        <span className="text-muted-foreground">
          {rating > 0 ? rating.toFixed(1) : "—"}
          {count !== undefined && count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}
