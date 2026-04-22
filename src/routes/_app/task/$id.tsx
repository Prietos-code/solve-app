import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ImageIcon, CheckCircle2, Clock, MessageCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CategoryBadge } from "@/components/CategoryBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { StarRating } from "@/components/StarRating";
import { RateTaskDialog } from "@/components/RateTaskDialog";
import { formatPrice, timeAgo } from "@/lib/format";
import type { Category, TaskStatus } from "@/lib/categories";

export const Route = createFileRoute("/_app/task/$id")({
  component: TaskDetailPage,
});

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  status: TaskStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  publisher_id: string;
  collaborator_id: string | null;
  created_at: string;
  publisher: { id: string; name: string; avatar_url: string | null; rating: number; rating_count: number };
}

function TaskDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from("tasks")
      .select(
        `id, title, description, price, category, status, latitude, longitude, address, image_url,
         publisher_id, collaborator_id, created_at,
         publisher:publisher_id ( id, name, avatar_url, rating, rating_count )`,
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("No se pudo cargar la tarea.");
        } else {
          setTask({ ...(data as any), price: Number((data as any).price) });
        }
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!user || !task || task.status !== "COMPLETED") return;
    supabase
      .from("ratings")
      .select("id")
      .eq("task_id", task.id)
      .eq("rater_id", user.id)
      .maybeSingle()
      .then(({ data }) => setHasRated(!!data));
  }, [user, task]);

  if (loading) return <div className="p-6 text-sm text-oak-soft">Cargando...</div>;
  if (error || !task) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Link to="/feed" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={14} /> Volver
        </Link>
      </div>
    );
  }

  const isPublisher = user?.id === task.publisher_id;
  const isCollaborator = user?.id === task.collaborator_id;
  const isOpen = task.status === "OPEN";

  const updateStatus = async (next: TaskStatus, extra: Record<string, any> = {}) => {
    setActing(true);
    setError(null);
    const { error } = await supabase
      .from("tasks")
      .update({ status: next, ...extra })
      .eq("id", task.id);
    setActing(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const onAccept = () =>
    updateStatus("ACCEPTED", { collaborator_id: user!.id, accepted_at: new Date().toISOString() });
  const onStart = () => updateStatus("IN_PROGRESS");
  const onComplete = () => updateStatus("COMPLETED", { completed_at: new Date().toISOString() });
  const onCancel = async () => {
    if (!confirm("¿Seguro que quieres cancelar la tarea?")) return;
    if (isOpen) {
      setActing(true);
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      setActing(false);
      if (error) {
        setError(error.message);
        return;
      }
      navigate({ to: "/my-tasks" });
    } else {
      updateStatus("CANCELLED");
    }
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${task.longitude - 0.01},${task.latitude - 0.01},${task.longitude + 0.01},${task.latitude + 0.01}&layer=mapnik&marker=${task.latitude},${task.longitude}`;

  return (
    <div className="pb-10">
      <div className="relative">
        {task.image_url ? (
          <div className="aspect-[16/10] w-full bg-paper-warm">
            <img src={task.image_url} alt={task.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-primary text-primary-foreground/70">
            <ImageIcon size={56} strokeWidth={1.2} />
          </div>
        )}
        <button
          onClick={() => navigate({ to: "/feed" })}
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-primary shadow-card backdrop-blur"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="px-5 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={task.category} size="md" />
          <StatusBadge status={task.status} />
        </div>

        <h1 className="mt-4 font-serif text-[30px] font-semibold leading-tight text-primary">
          {task.title}
        </h1>

        <div className="mt-4 flex items-baseline gap-3 border-b border-border pb-5">
          <span className="font-serif text-5xl font-semibold leading-none tabular-nums text-primary">
            {formatPrice(task.price)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-oak-soft">
            por la tarea
          </span>
        </div>

        <p className="mt-5 whitespace-pre-line font-serif text-[17px] leading-relaxed text-foreground/85">
          {task.description}
        </p>

        <Link
          to="/profile"
          className="mt-7 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-oak-soft/40 hover:shadow-card"
        >
          <UserAvatar name={task.publisher.name} url={task.publisher.avatar_url} size={48} />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Publicado por</div>
            <div className="font-serif text-lg font-semibold text-primary">{task.publisher.name}</div>
            <StarRating rating={task.publisher.rating} count={task.publisher.rating_count} />
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-oak-soft">
            <Clock size={12} />
            {timeAgo(task.created_at)}
          </div>
        </Link>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Ubicación"
            src={mapUrl}
            className="h-44 w-full border-0 grayscale-[0.2]"
            loading="lazy"
          />
          {task.address && (
            <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3 text-xs text-primary">
              <MapPin size={13} className="text-oak-soft" />
              <span className="font-medium">{task.address}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-7 space-y-3">
          {(isPublisher || isCollaborator) &&
            (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
              <Link
                to="/chat/$id"
                params={{ id: task.id }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-paper-warm"
              >
                <MessageCircle size={17} />
                Abrir chat
              </Link>
            )}

          {!isPublisher && isOpen && (
            <button
              onClick={onAccept}
              disabled={acting}
              className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-elevated transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {acting ? "Aceptando..." : `Aceptar tarea por ${formatPrice(task.price)}`}
            </button>
          )}

          {isCollaborator && task.status === "ACCEPTED" && (
            <button
              onClick={onStart}
              disabled={acting}
              className="w-full rounded-xl bg-warning px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-warning-foreground shadow-elevated disabled:opacity-50"
            >
              Marcar como en curso
            </button>
          )}

          {isCollaborator && task.status === "IN_PROGRESS" && (
            <div className="rounded-xl border border-border bg-paper-warm p-4 text-center text-sm italic text-oak-soft">
              Esperando confirmación del usuario para liberar el pago.
            </div>
          )}

          {isPublisher && (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
            <button
              onClick={onComplete}
              disabled={acting}
              className="w-full rounded-xl bg-success px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-success-foreground shadow-elevated disabled:opacity-50"
            >
              Confirmar completada
            </button>
          )}

          {(isPublisher || isCollaborator) &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED" && (
              <button
                onClick={onCancel}
                disabled={acting}
                className="w-full rounded-xl border border-destructive/40 bg-card px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-destructive disabled:opacity-50"
              >
                {isOpen ? "Eliminar tarea" : "Cancelar tarea"}
              </button>
            )}

          {task.status === "COMPLETED" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-bold uppercase tracking-[0.14em] text-success">
              <CheckCircle2 size={18} />
              Tarea completada
            </div>
          )}

          {task.status === "COMPLETED" && (isPublisher || isCollaborator) && (
            hasRated ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs italic text-oak-soft">
                <Star size={14} className="fill-warning text-warning" />
                Ya has valorado esta tarea
              </div>
            ) : (
              <button
                onClick={() => setRateOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-warning px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-warning-foreground shadow-elevated transition-transform active:scale-[0.99]"
              >
                <Star size={17} />
                Valorar a {isPublisher ? "colaborador" : task.publisher.name.split(" ")[0]}
              </button>
            )
          )}
        </div>
      </div>

      {user && task.status === "COMPLETED" && (isPublisher || isCollaborator) && (
        <RateTaskDialog
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          taskId={task.id}
          raterId={user.id}
          ratedId={isPublisher ? task.collaborator_id! : task.publisher_id}
          ratedName={isPublisher ? "colaborador" : task.publisher.name}
          onRated={() => setHasRated(true)}
        />
      )}
    </div>
  );
}
