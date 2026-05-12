import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function PublishButton() {
  return (
    <Link
      to="/publish"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95"
    >
      <Plus size={18} strokeWidth={2.5} />
      <span>Publicar tarea</span>
    </Link>
  );
}