import { CATEGORY_MAP, type Category } from "@/lib/categories";

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const c = CATEGORY_MAP[category];
  const Icon = c.icon;
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const iconSize = size === "sm" ? 11 : 13;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${padding}`}
      style={{ backgroundColor: c.colorVar }}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      <span>{c.label}</span>
    </span>
  );
}
