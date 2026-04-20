import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { UserAvatar } from "./UserAvatar";
import { formatDistance, formatPrice, timeAgo } from "@/lib/format";
import type { Category } from "@/lib/categories";

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
  return (
    <Link
      to="/task/$id"
      params={{ id: task.id }}
      className="block overflow-hidden rounded-2xl bg-card shadow-card transition-transform active:scale-[0.98]"
    >
      {task.image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img src={task.image_url} alt={task.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CategoryBadge category={task.category} />
            <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold text-foreground">{task.title}</h3>
          </div>
          <div className="shrink-0 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
            {formatPrice(task.price)}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar name={task.publisher_name} url={task.publisher_avatar} size={28} />
            <span className="truncate text-xs text-muted-foreground">{task.publisher_name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
            {task.distance_km != null && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} />
                {formatDistance(task.distance_km)}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Clock size={11} />
              {timeAgo(task.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
