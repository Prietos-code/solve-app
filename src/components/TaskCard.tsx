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
  publisher_id: string;
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
      className="group block overflow-hidden rounded-2xl border border-transparent bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]"
    >
      {task.image_url && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-paper-warm">
          <img
            src={task.image_url}
            alt={task.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="p-4">
        {/* Header row: price + category */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="shrink-0 font-serif text-2xl font-bold tabular-nums leading-none text-primary">
            {formatPrice(task.price)}
          </span>
          <CategoryBadge category={task.category} />
        </div>

        {/* Title */}
        <h3 className="font-serif text-[15px] leading-snug text-primary line-clamp-2 transition-colors group-hover:text-oak-soft">
          {task.title}
        </h3>

        {/* Meta: distance · time */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-oak-soft">
          {task.distance_km != null && (
            <>
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={10} strokeWidth={2.4} />
                {formatDistance(task.distance_km)}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="inline-flex items-center gap-0.5">
            <Clock size={10} strokeWidth={2.4} />
            {timeAgo(task.created_at)}
          </span>
        </div>

        {/* Publisher row */}
        <div className="mt-3.5 flex items-center justify-between border-t border-paper-warm pt-3">
          <Link to="/user/$id" params={{ id: task.publisher_id }} className="flex min-w-0 items-center gap-2 hover:opacity-80">
            <UserAvatar name={task.publisher_name} url={task.publisher_avatar} size={24} />
            <span className="truncate text-xs font-medium text-primary/80">
              {task.publisher_name}
            </span>
          </Link>
        </div>
      </div>
    </Link>
  );
}