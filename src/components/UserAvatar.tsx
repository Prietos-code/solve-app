interface Props {
  name?: string | null;
  url?: string | null;
  size?: number;
}

const COLORS = [
  "oklch(0.62 0.20 256)",
  "oklch(0.69 0.16 162)",
  "oklch(0.78 0.15 75)",
  "oklch(0.62 0.22 295)",
  "oklch(0.69 0.20 0)",
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
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
