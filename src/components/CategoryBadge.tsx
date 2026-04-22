import { CATEGORY_MAP, type Category } from "@/lib/categories";

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const c = CATEGORY_MAP[category];
  const Icon = c.icon;
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const iconSize = size === "sm" ? 10 : 12;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-paper-warm font-bold uppercase tracking-[0.14em] ${padding}`}
      style={{ color: c.colorVar, borderColor: `color-mix(in oklab, ${c.colorVar} 35%, transparent)` }}
    >
      <Icon size={iconSize} strokeWidth={2.4} />
      <span>{c.label}</span>
    </span>
  );
}
