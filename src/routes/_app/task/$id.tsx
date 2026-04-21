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

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
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
          <div className="aspect-[16/10] w-full bg-muted">
            <img src={task.image_url} alt={task.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className="flex aspect-[16/10] w-full items-center justify-center text-primary-foreground/80"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            <ImageIcon size={56} strokeWidth={1.4} />
          </div>
        )}
        <button
          onClick={() => navigate({ to: "/feed" })}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/85 text-foreground shadow-card backdrop-blur"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="px-5 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={task.category} size="md" />
          <StatusBadge status={task.status} />
        </div>

        <h1 className="mt-3 text-2xl">{task.title}</h1>

        <div
          className="mt-3 inline-flex items-center rounded-xl px-4 py-2 text-xl font-bold text-primary-foreground shadow-elevated"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
        >
          {formatPrice(task.price)}
        </div>

        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
          {task.description}
        </p>

        <Link
          to="/profile"
          className="mt-6 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform active:scale-[0.99]"
        >
          <UserAvatar name={task.publisher.name} url={task.publisher.avatar_url} size={44} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Publicado por
            </div>
            <div className="font-semibold">{task.publisher.name}</div>
            <StarRating rating={task.publisher.rating} count={task.publisher.rating_count} />
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            {timeAgo(task.created_at)}
          </div>
        </Link>

        <div className="mt-5 overflow-hidden rounded-2xl shadow-card">
          <iframe
            title="Ubicación"
            src={mapUrl}
            className="h-44 w-full border-0"
            loading="lazy"
          />
          {task.address && (
            <div className="flex items-center gap-1.5 bg-card px-4 py-2.5 text-xs text-muted-foreground">
              <MapPin size={13} className="text-primary" />
              {task.address}
            </div>
          )}
        </div>

        {error && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="mt-6 space-y-2">
          {(isPublisher || isCollaborator) &&
            (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
              <Link
                to="/chat/$id"
                params={{ id: task.id }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-3.5 text-base font-semibold text-primary shadow-card transition-transform active:scale-[0.99]"
              >
                <MessageCircle size={18} />
                Abrir chat
              </Link>
            )}

          {!isPublisher && isOpen && (
            <button
              onClick={onAccept}
              disabled={acting}
              className="w-full rounded-xl px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-elevated transition-transform active:scale-[0.99] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
            >
              {acting ? "Aceptando..." : `Aceptar tarea por ${formatPrice(task.price)}`}
            </button>
          )}

          {isCollaborator && task.status === "ACCEPTED" && (
            <button
              onClick={onStart}
              disabled={acting}
              className="w-full rounded-xl bg-warning px-4 py-3.5 text-base font-semibold text-warning-foreground shadow-elevated disabled:opacity-50"
            >
              Marcar como en curso
            </button>
          )}

          {isCollaborator && task.status === "IN_PROGRESS" && (
            <div className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground shadow-card">
              Esperando confirmación del usuario para liberar el pago.
            </div>
          )}

          {isPublisher && (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
            <button
              onClick={onComplete}
              disabled={acting}
              className="w-full rounded-xl bg-success px-4 py-3.5 text-base font-semibold text-success-foreground shadow-elevated disabled:opacity-50"
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
                className="w-full rounded-xl border border-destructive bg-card px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-50"
              >
                {isOpen ? "Eliminar tarea" : "Cancelar tarea"}
              </button>
            )}

          {task.status === "COMPLETED" && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">
              <CheckCircle2 size={18} />
              Tarea completada
            </div>
          )}

          {task.status === "COMPLETED" && (isPublisher || isCollaborator) && (
            hasRated ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground shadow-card">
                <Star size={14} className="fill-warning text-warning" />
                Ya has valorado esta tarea
              </div>
            ) : (
              <button
                onClick={() => setRateOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-warning px-4 py-3.5 text-base font-semibold text-warning-foreground shadow-elevated transition-transform active:scale-[0.99]"
              >
                <Star size={18} />
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
