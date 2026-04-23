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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-3 pt-1.5">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          if (it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="relative flex min-w-[64px] flex-col items-center gap-1 px-2 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                aria-label={it.label}
              >
                <span className="flex h-11 items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated transition-transform active:scale-95">
                    <it.Icon size={24} strokeWidth={2.2} />
                  </span>
                </span>
                <span className="text-oak-soft">{it.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`relative flex min-w-[64px] flex-col items-center gap-1 px-2 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                active ? "text-primary" : "text-oak-soft hover:text-primary"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                />
              )}
              <span className="flex h-11 items-center justify-center">
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
