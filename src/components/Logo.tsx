interface Props {
  size?: number;
  className?: string;
  tone?: "light" | "dark";
}

/**
 * HelpApp brand mark — a serif "H" inscribed inside a hand-drawn oak ring,
 * evoking a wax-stamped seal on parchment.
 */
export function Logo({ size = 40, className, tone = "light" }: Props) {
  const stroke = tone === "light" ? "#FDFCF9" : "#4A3728";
  const fill = tone === "light" ? "#FDFCF9" : "#4A3728";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* outer oak ring with subtle imperfection */}
      <path
        d="M20 4.4c8.6 0 15.6 7 15.6 15.6S28.6 35.6 20 35.6 4.4 28.6 4.4 20 11.4 4.4 20 4.4Z"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1.1"
      />
      <path
        d="M20 6.8c7.3 0 13.2 5.9 13.2 13.2"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* serif H monogram */}
      <path
        d="M13.5 12.5h2.6v6.1h7.8v-6.1h2.6v15h-2.6v-6.6h-7.8v6.6h-2.6v-15Z"
        fill={fill}
      />
      {/* serif feet */}
      <rect x="11.4" y="11.6" width="6.8" height="0.9" fill={fill} />
      <rect x="11.4" y="27.5" width="6.8" height="0.9" fill={fill} />
      <rect x="21.8" y="11.6" width="6.8" height="0.9" fill={fill} />
      <rect x="21.8" y="27.5" width="6.8" height="0.9" fill={fill} />
    </svg>
  );
}
