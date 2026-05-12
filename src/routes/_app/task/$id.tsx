import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ImageIcon, CheckCircle2, Clock, MessageCircle, Star, Users, Check, Shield, Flame, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, STRIPE_COMMISSION_PERCENT } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { CategoryBadge } from "@/components/CategoryBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { StarRating } from "@/components/StarRating";
import { RateTaskDialog } from "@/components/RateTaskDialog";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
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

interface Application {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  applicant: { id: string; name: string; avatar_url: string | null; rating: number; rating_count: number };
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
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showApplicants, setShowApplicants] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [relatedTasks, setRelatedTasks] = useState<TaskCardData[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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

    if (user) {
      supabase
        .from("favorites")
        .select("id")
        .eq("task_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsFavorited(!!data));
    }
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!user || !task) return;
    supabase
      .from("applications")
      .select(`id, user_id, message, status, created_at`)
      .eq("task_id", task.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMyApplication(data));
    if (user.id === task.publisher_id) {
      supabase
        .from("applications")
        .select(`id, user_id, message, status, created_at, applicant:user_id ( id, name, avatar_url, rating, rating_count )`)
        .eq("task_id", task.id)
        .order("created_at", { ascending: true })
        .then(({ data }) => setApplications((data || []) as Application[]));
    }
  }, [user, task]);

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

  useEffect(() => {
    if (!task) return;
    supabase
      .rpc("tasks_nearby", {
        user_lat: task.latitude,
        user_lng: task.longitude,
        radius_km: 10,
        filter_category: task.category,
        page_size: 10,
        page_offset: 0,
      })
      .then(({ data }) => {
        if (data) {
          setRelatedTasks(
            (data as any[])
              .filter((t: any) => t.id !== task.id)
              .slice(0, 6)
              .map((t: any) => ({
                id: t.id,
                title: t.title,
                price: Number(t.price),
                category: t.category,
                image_url: t.image_url,
                publisher_id: t.publisher_id,
                publisher_name: t.publisher_name,
                publisher_avatar: t.publisher_avatar,
                created_at: t.created_at,
                distance_km: t.distance_km,
              })),
          );
        }
      });
  }, [task]);

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
  const pendingCount = applications.filter(a => a.status === "PENDING").length;

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

  const onApply = async () => {
    if (!user) return;
    setActing(true);
    const { error } = await supabase
      .from("applications")
      .insert({ task_id: task.id, user_id: user.id, message: applyMessage.trim() || null });
    setActing(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMyApplication({ id: "", user_id: user.id, message: applyMessage || null, status: "PENDING", created_at: new Date().toISOString(), applicant: { id: user.id, name: "", avatar_url: null, rating: 0, rating_count: 0 } });
    setApplyOpen(false);
    setApplyMessage("");
  };

  const toggleFavorite = async () => {
    if (!user || favoriteLoading) return;
    setFavoriteLoading(true);
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("task_id", task.id).eq("user_id", user.id);
      setIsFavorited(false);
    } else {
      await supabase.from("favorites").insert({ task_id: task.id, user_id: user.id });
      setIsFavorited(true);
    }
    setFavoriteLoading(false);
  };

  const onAcceptApplicant = async (applicantId: string) => {
    if (!confirm("¿Aceptar a este candidato?")) return;
    setActing(true);
    const { error } = await supabase
      .from("applications")
      .update({ status: "ACCEPTED" })
      .eq("id", applications.find(a => a.user_id === applicantId)?.id);
    if (!error) {
      await updateStatus("ACCEPTED", { collaborator_id: applicantId, accepted_at: new Date().toISOString() });
    }
    setActing(false);
  };

  const onStart = () => updateStatus("IN_PROGRESS");
  const onComplete = () => updateStatus("COMPLETED", { completed_at: new Date().toISOString() });
  const onCancel = async () => {
    if (!confirm("¿Seguro que quieres cancelar la tarea?")) return;
    if (isOpen) {
      setActing(true);
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      setActing(false);
      if (error) { setError(error.message); return; }
      navigate({ to: "/my-tasks" });
    } else {
      updateStatus("CANCELLED");
    }
  };

  const onCheckout = async () => {
    if (!user || !task) return
    setActing(true)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
          price: task.price,
          buyerId: user.id,
        }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      window.location.href = url
    } catch (e: any) {
      setError(e.message ?? 'Error iniciando el pago')
    } finally {
      setActing(false)
    }
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${task.longitude - 0.01},${task.latitude - 0.01},${task.longitude + 0.01},${task.latitude + 0.01}&layer=mapnik&marker=${task.latitude},${task.longitude}`;

  return (
    <div className="pb-10">
      {/* Back button */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-xl safe-top">
        <button
          onClick={() => navigate({ to: "/feed" })}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm"
          aria-label="Volver"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium text-primary">Detalle de tarea</span>
      </div>

      {/* Main content: 2-column layout on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8 px-4 sm:px-6 lg:px-0 py-6">

        {/* LEFT COLUMN (3/5) */}
        <div className="lg:col-span-3">
          {/* Image or placeholder */}
          <div className="relative overflow-hidden rounded-2xl bg-paper-warm">
            {task.image_url ? (
              <div className="aspect-[4/3] w-full">
                <img src={task.image_url} alt={task.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center">
                <ImageIcon size={64} strokeWidth={1} className="text-oak-soft/50" />
              </div>
            )}
          </div>

          {/* Map below image */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Ubicación"
              src={mapUrl}
              className="h-40 w-full border-0 grayscale-[0.2]"
              loading="lazy"
            />
            {task.address && (
              <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3 text-xs text-primary">
                <MapPin size={13} className="text-oak-soft" />
                <span className="font-medium">{task.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (2/5) - sticky */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={task.category} size="md" />
                <StatusBadge status={task.status} />
              </div>
              <h1 className="font-serif text-[26px] font-semibold leading-tight text-primary">
                {task.title}
              </h1>
              <p className="mt-1 text-xs text-oak-soft">
                Categoría · {timeAgo(task.created_at)} · {task.publisher.name}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[34px] font-bold tabular-nums leading-none text-primary">
                {formatPrice(task.price)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-oak-soft">
                por la tarea
              </span>
            </div>

            {/* Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 border border-success/25 px-3 py-1.5 text-xs font-semibold text-success">
                <Shield size={13} />
                Pago seguro incluido
              </div>
              {pendingCount > 0 && (
                <div className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/25 px-3 py-1.5 text-xs font-semibold text-warning">
                  <Flame size={12} />
                  {pendingCount} persona{pendingCount > 1 ? "s" : ""} ha{pendingCount === 1 ? "" : "n"} solicitado recientemente
                </div>
              )}
            </div>

            {/* Details table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: "Categoría", value: task.category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) },
                    { label: "Distancia", value: "A unos km de ti" },
                    { label: "Publicado", value: timeAgo(task.created_at) },
                    { label: "Estado", value: task.status === "OPEN" ? "Disponible" : task.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) },
                  ].map((row, i) => (
                    <tr key={row.label} className={i > 0 ? "border-t border-border" : ""}>
                      <td className="px-4 py-2.5 text-oak-soft font-medium text-xs uppercase tracking-wider">{row.label}</td>
                      <td className="px-4 py-2.5 text-primary font-semibold text-right">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Description */}
            <div>
              <p className="whitespace-pre-line font-serif text-[16px] leading-relaxed text-foreground/85">
                {task.description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-1">
              {!isPublisher && !isCollaborator && isOpen && (
                myApplication ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-4 text-sm font-bold uppercase tracking-wider text-success">
                    <Check size={16} />
                    Solicitud enviada
                  </div>
                ) : (
                  <button
                    onClick={onCheckout}
                    disabled={acting}
                    className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-elevated transition-transform active:scale-[0.99] disabled:opacity-50"
                  >
                    {acting ? "Redirigiendo al pago..." : "Aceptar y pagar"}
                  </button>
                )
              )}

              {!isPublisher && !isCollaborator && isOpen && (
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium uppercase tracking-wider text-oak-soft transition-colors hover:bg-paper-warm"
                >
                  <Star size={16} fill={isFavorited ? "currentColor" : "none"} className="inline mr-2" />
                  {isFavorited ? "Guardada" : "Guardar tarea"}
                </button>
              )}
            </div>

            {/* Protection note */}
            <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-paper-warm/50 p-3">
              <Shield size={14} className="mt-0.5 shrink-0 text-oak-soft" />
              <p className="text-xs text-oak-soft leading-relaxed">
                El pago queda retenido hasta que confirmes que la tarea se ha completado correctamente.
              </p>
            </div>

            {/* Apply dialog */}
            {applyOpen && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 font-serif text-base font-semibold text-primary">¿Por qué quieres ayudar?</h3>
                <textarea
                  value={applyMessage}
                  onChange={e => setApplyMessage(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Cuéntale al publicador por qué eres el candidato ideal (opcional)"
                  className="w-full resize-none rounded-xl border border-input bg-paper-warm px-4 py-3 text-sm outline-none focus:border-primary focus:bg-card"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setApplyOpen(false); setApplyMessage(""); }}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-oak-soft"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onApply}
                    disabled={acting}
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {acting ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </div>
              </div>
            )}

            {/* Applicants panel for publisher */}
            {isPublisher && isOpen && pendingCount > 0 && (
              <button
                onClick={() => setShowApplicants(v => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-success-foreground shadow-elevated"
              >
                <Users size={17} />
                Ver candidatos ({pendingCount})
              </button>
            )}

            {/* Applicants list */}
            {showApplicants && isPublisher && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 font-serif text-base font-semibold text-primary">Candidatos</h3>
                {applications.length === 0 ? (
                  <p className="text-sm text-oak-soft">No hay candidatos aún.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.filter(a => a.status === "PENDING").map(app => (
                      <div key={app.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <UserAvatar name={app.applicant.name} url={app.applicant.avatar_url} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary">{app.applicant.name}</p>
                          <StarRating rating={app.applicant.rating} count={app.applicant.rating_count} size="sm" />
                          {app.message && <p className="mt-1 text-xs text-oak-soft italic">"{app.message}"</p>}
                        </div>
                        <button
                          onClick={() => onAcceptApplicant(app.user_id)}
                          disabled={acting}
                          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                        >
                          Aceptar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(isPublisher || isCollaborator) &&
              (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
                <Link
                  to="/chat/$id"
                  params={{ id: task.id }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-paper-warm"
                >
                  <MessageCircle size={17} />
                  Abrir chat
                </Link>
              )}

            {isCollaborator && task.status === "ACCEPTED" && (
              <button
                onClick={onStart}
                disabled={acting}
                className="w-full rounded-xl bg-warning px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-warning-foreground shadow-elevated disabled:opacity-50"
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
                className="w-full rounded-xl bg-success px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-success-foreground shadow-elevated disabled:opacity-50"
              >
                Confirmar completada
              </button>
            )}

            {isPublisher && task.status === "OPEN" && (
              <button
                onClick={onCancel}
                disabled={acting}
                className="w-full rounded-xl border border-destructive/40 bg-card px-4 py-3 text-xs font-bold uppercase tracking-wider text-destructive disabled:opacity-50"
              >
                {acting ? "Eliminando..." : "Eliminar tarea"}
              </button>
            )}

            {isPublisher && (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
              <button
                onClick={onCancel}
                disabled={acting}
                className="w-full rounded-xl border border-destructive/40 bg-card px-4 py-3 text-xs font-bold uppercase tracking-wider text-destructive disabled:opacity-50"
              >
                {acting ? "Cancelando..." : "Cancelar tarea"}
              </button>
            )}

            {isCollaborator && (task.status === "ACCEPTED" || task.status === "IN_PROGRESS") && (
              <button
                onClick={onCancel}
                disabled={acting}
                className="w-full rounded-xl border border-destructive/40 bg-card px-4 py-3 text-xs font-bold uppercase tracking-wider text-destructive disabled:opacity-50"
              >
                {acting ? "Abandonando..." : "Abandonar tarea"}
              </button>
            )}

            {task.status === "COMPLETED" && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-bold uppercase tracking-wider text-success">
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-warning px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-warning-foreground shadow-elevated transition-transform active:scale-[0.99]"
                >
                  <Star size={17} />
                  Valorar a {isPublisher ? "colaborador" : task.publisher.name.split(" ")[0]}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="px-4 sm:px-6 lg:px-0">

        {/* Publisher card */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <UserAvatar name={task.publisher.name} url={task.publisher.avatar_url} size={56} />
          <div className="flex-1 min-w-0">
            <p className="eyebrow">Publicado por</p>
            <p className="mt-0.5 font-serif text-xl font-semibold text-primary">{task.publisher.name}</p>
            <StarRating rating={task.publisher.rating} count={task.publisher.rating_count} />
          </div>
          <Link
            to="/profile"
            className="shrink-0 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-oak-soft hover:text-primary transition-colors"
          >
            Ver perfil <ChevronRight size={14} />
          </Link>
        </div>

        {/* Related tasks */}
        {relatedTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="font-serif text-xl font-semibold text-primary mb-4">Tareas parecidas</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0">
              {relatedTasks.map(t => (
                <div key={t.id} className="w-64 shrink-0">
                  <TaskCard task={t} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-0 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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