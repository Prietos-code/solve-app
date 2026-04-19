import { CATEGORY_MAP, type Category } from "@/lib/categories";

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const c = CATEGORY_MAP[category];
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold text-white ${padding}`}
      style={{ backgroundColor: c.colorVar }}
    >
      <span>{c.emoji}</span>
      <span>{c.label}</span>
    </span>
  );
}
