import { useEffect, useRef } from "react";

interface Props {
  size?: number;
  className?: string;
  tone?: "light" | "dark";
  spin?: boolean;
}

/**
 * SOLVE brand mark — a bold "S" inside a geometric circle.
 * The S represents solutions, services, and the community helping each other.
 */
export function Logo({ size = 40, className, tone = "light", spin = false }: Props) {
  const fill = tone === "light" ? "#FDFCF9" : "#4A3728";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className ?? ""} ${spin ? "logo-spin" : ""}`}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle
        cx="20"
        cy="20"
        r="17"
        stroke={fill}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* SOLVE "S" lettermark */}
      <path
        d="M25.5 14.5C25.5 13.5 24.5 13 23 13C21.5 13 20.5 13.5 20.5 14.5C20.5 15.5 21.5 16 23 16C23.5 16 24 16 24.5 16.2V17.5C24 17.7 23.3 18 22 18C20.5 18 19.2 17.4 19.2 16C19.2 14.6 20.2 14 21.2 14C21.7 14 22.1 14.2 22.3 14.4L22.7 14L24 12H19.5L19 13C18.5 12 18 11.5 17 11.5C15.5 11.5 14.5 12.5 14.5 14C14.5 15.5 15.2 16 16.2 16.8C17.2 17.6 17.2 18 17.2 18.5C17.2 19.5 16.2 20 15 20C13.5 20 12.5 19.5 12.5 18.5H11.5C11.5 20 12.8 21 15 21C17 21 18.2 20.2 18.2 19V18C18.5 17.7 19.8 17.5 21.2 17.5C23.5 17.5 25.5 16.5 25.5 14.5Z"
        fill={fill}
      />

      {/* Accent dot */}
      <circle cx="26" cy="14" r="1.5" fill={fill} />
    </svg>
  );
}