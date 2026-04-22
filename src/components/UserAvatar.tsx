interface Props {
  name?: string | null;
  url?: string | null;
  size?: number;
}

const COLORS = [
  "oklch(0.58 0.13 35)",   // terracota
  "oklch(0.55 0.10 145)",  // moss
  "oklch(0.68 0.13 60)",   // honey
  "oklch(0.45 0.07 230)",  // slate
  "oklch(0.50 0.09 15)",   // clay
];

export function UserAvatar({ name, url, size = 36 }: Props) {
  const initial = (name?.trim()[0] ?? "?").toUpperCase();
  const color = COLORS[(initial.charCodeAt(0) || 0) % COLORS.length];

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "Usuario"}
        width={size}
        height={size}
        className="rounded-full border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full border border-border font-serif font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
