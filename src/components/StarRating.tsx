import { Star } from "lucide-react";

interface Props {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function StarRating({ rating, count, size = "sm", showCount = true }: Props) {
  const filled = Math.round(rating);
  const sz = size === "sm" ? "text-xs" : "text-sm";
  const iconSz = size === "sm" ? 12 : 15;
  return (
    <span className={`inline-flex items-center gap-1 ${sz}`}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={iconSz}
            strokeWidth={2}
            className={i < filled ? "fill-warning text-warning" : "text-muted-foreground/30"}
          />
        ))}
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
