import { Link, useLocation } from "@tanstack/react-router";

type TabItem = { to: string; label: string; icon: string; primary?: boolean };

const items: TabItem[] = [
  { to: "/feed", label: "Inicio", icon: "🏠" },
  { to: "/publish", label: "Publicar", icon: "➕", primary: true },
  { to: "/my-tasks", label: "Mis tareas", icon: "📋" },
  { to: "/profile", label: "Perfil", icon: "👤" },
];

export function BottomTabs() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2 pt-1.5">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          if (it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="-mt-5 flex flex-col items-center"
                aria-label={it.label}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground shadow-elevated">
                  {it.icon}
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{it.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
