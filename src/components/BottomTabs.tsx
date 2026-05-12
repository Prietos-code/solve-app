import { Link, useLocation } from "@tanstack/react-router";
import { Home, Plus, ClipboardList, User, type LucideIcon } from "lucide-react";

type TabItem = { to: string; label: string; Icon: LucideIcon; primary?: boolean };

const items: TabItem[] = [
  { to: "/feed", label: "Inicio", Icon: Home },
  { to: "/publish", label: "Publicar", Icon: Plus, primary: true },
  { to: "/my-tasks", label: "Mis tareas", Icon: ClipboardList },
  { to: "/profile", label: "Perfil", Icon: User },
];

export function BottomTabs() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)] safe-bottom">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-4 pt-1">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          if (it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="relative flex min-w-[64px] flex-col items-center gap-1 px-2 pb-2 pt-3"
                aria-label={it.label}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(30,50,80,0.3)] transition-transform active:scale-95">
                  <it.Icon size={26} strokeWidth={2.2} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`relative flex min-w-[64px] flex-col items-center gap-1 px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                active ? "text-primary" : "text-oak-soft hover:text-primary"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                />
              )}
              <span className="flex h-10 w-10 items-center justify-center">
                <it.Icon size={22} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}