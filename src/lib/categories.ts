export type Category = "RECADOS" | "MASCOTAS" | "MUDANZAS" | "CLASES" | "HOGAR" | "OTROS";

export const CATEGORIES: {
  value: Category;
  label: string;
  emoji: string;
  colorVar: string;
}[] = [
  { value: "RECADOS", label: "Recados", emoji: "🛍️", colorVar: "var(--cat-recados)" },
  { value: "MASCOTAS", label: "Mascotas", emoji: "🐶", colorVar: "var(--cat-mascotas)" },
  { value: "MUDANZAS", label: "Mudanzas", emoji: "📦", colorVar: "var(--cat-mudanzas)" },
  { value: "CLASES", label: "Clases", emoji: "📚", colorVar: "var(--cat-clases)" },
  { value: "HOGAR", label: "Hogar", emoji: "🔧", colorVar: "var(--cat-hogar)" },
  { value: "OTROS", label: "Otros", emoji: "✨", colorVar: "var(--cat-otros)" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<Category, (typeof CATEGORIES)[number]>;

export type TaskStatus =
  | "OPEN"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: "Disponible",
  ACCEPTED: "Aceptada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  DISPUTED: "En disputa",
};

export const STATUS_TONE: Record<TaskStatus, "primary" | "warning" | "success" | "destructive" | "muted"> = {
  OPEN: "primary",
  ACCEPTED: "warning",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
};
