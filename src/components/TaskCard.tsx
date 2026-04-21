import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { UserAvatar } from "./UserAvatar";
import { formatDistance, formatPrice, timeAgo } from "@/lib/format";
import { CATEGORY_MAP, type Category } from "@/lib/categories";

export interface TaskCardData {
  id: string;
  title: string;
  price: number;
  category: Category;
  image_url: string | null;
  publisher_name: string | null;
  publisher_avatar: string | null;
  created_at: string;
  distance_km?: number | null;
}

export function TaskCard({ task }: { task: TaskCardData }) {
  const accent = CATEGORY_MAP[task.category]?.colorVar ?? "var(--primary)";
  return (
    <Link
      to="/task/$id"
      params={{ id: task.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-elevated active:scale-[0.985]"
    >
      {/* Accent bar by category */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      {task.image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={task.image_url}
            alt={task.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CategoryBadge category={task.category} />
            <h3 className="mt-2 line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-tight text-foreground">
              {task.title}
            </h3>
          </div>
          <div className="shrink-0 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold tracking-tight text-primary ring-1 ring-inset ring-primary/15">
            {formatPrice(task.price)}
          </div>
        </div>
        <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar name={task.publisher_name} url={task.publisher_avatar} size={26} />
            <span className="truncate text-xs font-medium text-foreground/80">
              {task.publisher_name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-medium text-muted-foreground">
            {task.distance_km != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} strokeWidth={2.4} />
                {formatDistance(task.distance_km)}
              </span>
            )}
            <span aria-hidden className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
            <span className="inline-flex items-center gap-1">
              <Clock size={11} strokeWidth={2.4} />
              {timeAgo(task.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
