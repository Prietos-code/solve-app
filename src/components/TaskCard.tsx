import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { UserAvatar } from "./UserAvatar";
import { formatDistance, formatPrice, timeAgo } from "@/lib/format";
import { type Category } from "@/lib/categories";

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
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-oak-soft/40 hover:shadow-elevated active:scale-[0.99]"
    >
      {task.image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-paper-warm">
          <img
            src={task.image_url}
            alt={task.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <CategoryBadge category={task.category} />
          <span className="font-serif text-2xl font-semibold tabular-nums leading-none text-primary">
            {formatPrice(task.price)}
          </span>
        </div>
        <h3 className="font-serif text-xl leading-snug text-primary line-clamp-2 transition-colors group-hover:text-oak-soft">
          {task.title}
        </h3>
        <div className="mt-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-oak-soft">
          {task.distance_km != null && (
            <>
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} strokeWidth={2.4} />
                {formatDistance(task.distance_km)}
              </span>
              <span aria-hidden className="h-0.5 w-0.5 rounded-full bg-oak-soft/50" />
            </>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock size={11} strokeWidth={2.4} />
            {timeAgo(task.created_at)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-paper-warm pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <UserAvatar name={task.publisher_name} url={task.publisher_avatar} size={28} />
            <span className="truncate text-sm font-medium text-primary/85">
              {task.publisher_name}
            </span>
          </div>
          <span className="rounded-lg bg-paper-warm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            Postular
          </span>
        </div>
      </div>
    </Link>
  );
}
