import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { X, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Category } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";

export const Route = createFileRoute("/_app/publish")({
  component: PublishPage,
});

function PublishPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords } = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("RECADOS");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const priceNum = Number(price.replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 5) {
      setError("El precio mínimo es de 5 €.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Título demasiado corto.");
      return;
    }
    if (description.trim().length < 5) {
      setError("Descripción demasiado corta.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("task-images")
          .upload(path, imageFile, { contentType: imageFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("task-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { data, error: insErr } = await supabase
        .from("tasks")
        .insert({
          title: title.trim(),
          description: description.trim(),
          category,
          price: priceNum,
          latitude: coords.lat,
          longitude: coords.lng,
          address: address.trim() || null,
          image_url: imageUrl,
          publisher_id: user.id,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      navigate({ to: "/task/$id", params: { id: data.id } });
    } catch (e: any) {
      setError(e.message ?? "Error publicando la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="eyebrow">Nueva tarea</p>
      <h1 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-primary">
        Publicar tarea
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-oak-soft">
        Cuenta con detalle qué necesitas y ponle un precio justo. Tu vecino estará encantado de ayudarte.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-6">
        <Field label="Título" hint={`${title.length}/60`}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
            placeholder="Ej. Pasear a mi perro 30 min"
            className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
          />
        </Field>

        <Field label="Descripción" hint={`${description.length}/300`}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            required
            rows={4}
            placeholder="Da más detalles para que un colaborador entienda la tarea"
            className="w-full resize-none rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
          />
        </Field>

        <Field label="Categoría">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-4 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                    active
                      ? "border-primary bg-paper-warm text-primary shadow-sharp"
                      : "border-border bg-card text-oak-soft hover:border-oak-soft/40 hover:text-primary"
                  }`}
                  style={active ? { color: c.colorVar, borderColor: c.colorVar } : undefined}
                >
                  <Icon size={20} strokeWidth={2} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Precio">
          <div className="relative">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              inputMode="decimal"
              placeholder="15"
              className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 pr-12 text-2xl font-serif font-semibold tabular-nums outline-none transition-all focus:border-primary focus:bg-card"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-serif text-2xl text-oak-soft">€</span>
          </div>
          <p className="mt-2 text-[11px] text-oak-soft">
            Mínimo 5 €. SOLVE retiene una comisión del 12 % al completarse la tarea.
          </p>
        </Field>

        <Field label="Ubicación (opcional)">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej. Calle Mayor, Madrid"
            className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
          />
          <p className="mt-2 text-[11px] text-oak-soft">
            Coordenadas detectadas: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
          </p>
        </Field>

        <Field label="Foto (opcional)">
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={imagePreview} alt="" className="aspect-video w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur"
              >
                <X size={12} /> Quitar
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-paper-warm px-4 py-10 text-sm text-oak-soft transition-colors hover:border-oak-soft/60 hover:bg-card">
              <ImagePlus size={28} strokeWidth={1.6} />
              <span className="mt-2 font-serif text-base text-primary">Añadir una foto</span>
              <span className="text-[11px] text-oak-soft">Toca para subir desde tu galería</span>
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
          )}
        </Field>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-elevated transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar tarea"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="eyebrow">{label}</label>
        {hint && <span className="text-[10px] font-medium text-oak-soft">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
