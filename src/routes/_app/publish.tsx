import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
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
    <div className="px-5 pb-8 pt-6">
      <h1 className="text-2xl">Publicar tarea</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe lo que necesitas y ponle un precio justo.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field label="Título" hint={`${title.length}/60`}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
            placeholder="Ej. Pasear a mi perro 30 min"
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
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
            className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </Field>

        <Field label="Categoría">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all ${
                    active ? "border-transparent text-white" : "border-border bg-card text-foreground"
                  }`}
                  style={active ? { backgroundColor: c.colorVar } : undefined}
                >
                  <span className="text-xl">{c.emoji}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Precio (€)">
          <div className="relative">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              inputMode="decimal"
              placeholder="15"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 pr-10 text-base outline-none focus:border-primary"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Mínimo 5 €. HelpApp retiene una comisión del 12%.</p>
        </Field>

        <Field label="Ubicación (opcional)">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej. Calle Mayor, Madrid"
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Coordenadas detectadas: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
          </p>
        </Field>

        <Field label="Foto (opcional)">
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-xl">
              <img src={imagePreview} alt="" className="aspect-video w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white"
              >
                Quitar
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground">
              <span className="text-2xl">📷</span>
              <span className="mt-1">Toca para añadir foto</span>
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
          )}
        </Field>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-elevated disabled:opacity-50"
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
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">{label}</label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
