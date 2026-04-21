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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/85 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2 pt-1.5">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          if (it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="-mt-6 flex flex-col items-center"
                aria-label={it.label}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-elevated transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                >
                  <it.Icon size={26} strokeWidth={2.5} />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-muted-foreground">{it.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`relative flex min-w-[64px] flex-col items-center gap-0.5 px-2 pb-2 pt-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                />
              )}
              <it.Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="font-semibold">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
