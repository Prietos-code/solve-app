import { useState } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  taskId: string;
  ratedId: string;
  ratedName: string;
  raterId: string;
  onRated: () => void;
}

export function RateTaskDialog({ open, onClose, taskId, ratedId, ratedName, raterId, onRated }: Props) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (score < 1) {
      setError("Selecciona al menos una estrella.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("ratings").insert({
      task_id: taskId,
      rater_id: raterId,
      rated_id: ratedId,
      score,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    onRated();
    onClose();
  };

  const display = hover || score;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-elevated sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Valora a {ratedName}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">¿Cómo fue tu experiencia?</p>

        <div className="mt-5 flex justify-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const v = i + 1;
            return (
              <button
                key={v}
                type="button"
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setScore(v)}
                className="transition-transform active:scale-90"
                aria-label={`${v} estrellas`}
              >
                <Star
                  size={40}
                  strokeWidth={1.6}
                  className={v <= display ? "fill-warning text-warning" : "text-muted-foreground/30"}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Deja un comentario (opcional)"
          className="mt-5 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />

        {error && <div className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">{error}</div>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            Más tarde
          </button>
          <button
            onClick={submit}
            disabled={submitting || score < 1}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevated disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {submitting ? "Enviando..." : "Enviar valoración"}
          </button>
        </div>
      </div>
    </div>
  );
}
