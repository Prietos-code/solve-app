interface Props {
  size?: number;
  className?: string;
}

/**
 * HelpApp brand mark — abstract handshake formed by two interlocking arcs.
 * Pure SVG so it stays crisp on any background.
 */
export function Logo({ size = 40, className }: Props) {
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
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="white" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M10 24c0-5 4-9 9-9 3 0 5 1 6 3"
        stroke="url(#logo-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M30 16c0 5-4 9-9 9-3 0-5-1-6-3"
        stroke="url(#logo-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="2.4" fill="white" />
    </svg>
  );
}
