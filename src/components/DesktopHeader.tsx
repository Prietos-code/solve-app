import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Bell, MessageSquare, User, Settings } from "lucide-react";

export function DesktopHeader() {
  const [spinning, setSpinning] = useState(false);

  const handleLogoClick = () => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => setSpinning(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-3">
        {/* Logo */}
        <Link to="/" className="shrink-0" onClick={handleLogoClick}>
          <img
            src="/logo_sin_fondo.png"
            alt="SOLVE"
            className={`h-10 w-auto logo-spin-3d ${spinning ? "spinning" : ""}`}
          />
        </Link>

        {/* Search bar */}
        <div className="relative flex-1 max-w-2xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-oak-soft/60" />
          <input
            type="search"
            placeholder="¿En qué podemos ayudarte hoy?"
            className="w-full rounded-full border border-border bg-paper-warm py-3 pl-11 pr-5 text-[14px] text-primary placeholder:text-oak-soft/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Right icons */}
        <nav className="flex shrink-0 items-center gap-1">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-oak-soft transition-colors hover:bg-paper-warm hover:text-primary" aria-label="Notificaciones">
            <Bell size={20} strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <Link to="/messages" className="flex h-10 w-10 items-center justify-center rounded-full text-oak-soft transition-colors hover:bg-paper-warm hover:text-primary" aria-label="Mensajes">
            <MessageSquare size={20} strokeWidth={1.8} />
          </Link>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full text-oak-soft transition-colors hover:bg-paper-warm hover:text-primary" aria-label="Perfil">
            <User size={20} strokeWidth={1.8} />
          </Link>
          <Link to="/settings" className="flex h-10 w-10 items-center justify-center rounded-full text-oak-soft transition-colors hover:bg-paper-warm hover:text-primary" aria-label="Configuración">
            <Settings size={20} strokeWidth={1.8} />
          </Link>
        </nav>
      </div>
    </header>
  );
}