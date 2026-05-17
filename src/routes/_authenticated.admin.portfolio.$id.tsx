import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/portfolio/$id")({
  component: AdminPortfolioEditor,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}

function AdminPortfolioEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["admin", "project", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: images, refetch: refetchImages } = useQuery({
    queryKey: ["admin", "project-images", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSlug(project.slug);
      setDescription(project.description ?? "");
      setLocation(project.location ?? "");
      setCategory(project.category ?? "");
      setYear(project.year?.toString() ?? "");
      setCoverUrl(project.cover_image_url ?? "");
      setPublished(project.published);
    }
  }, [project]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const finalSlug = slug || slugify(title);
    const payload = {
      title,
      slug: finalSlug,
      description: description || null,
      location: location || null,
      category: category || null,
      year: year ? parseInt(year) : null,
      cover_image_url: coverUrl || null,
      published,
    };
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("projects")
          .insert({ ...payload, created_by: user?.id })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Projeto criado");
        qc.invalidateQueries({ queryKey: ["admin", "projects"] });
        qc.invalidateQueries({ queryKey: ["portfolio"] });
        navigate({ to: "/admin/portfolio/$id", params: { id: data.id } });
      } else {
        const { error } = await supabase.from("projects").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Projeto salvo");
        qc.invalidateQueries({ queryKey: ["admin", "projects"] });
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
      toast.success("Capa enviada");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    if (isNew) {
      toast.error("Salve o projeto antes de adicionar imagens");
      return;
    }
    try {
      const sortStart = (images?.length ?? 0);
      const records = await Promise.all(
        Array.from(files).map(async (file, i) => {
          const url = await uploadFile(file);
          return { project_id: id, image_url: url, sort_order: sortStart + i };
        })
      );
      const { error } = await supabase.from("project_images").insert(records);
      if (error) throw error;
      toast.success(`${records.length} imagem(ns) enviadas`);
      refetchImages();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteImage = async (imgId: string) => {
    const { error } = await supabase.from("project_images").delete().eq("id", imgId);
    if (error) toast.error(error.message);
    else refetchImages();
  };

  return (
    <div className="max-w-3xl">
      <Link to="/admin/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mt-4 font-display font-bold text-3xl">
        {isNew ? "Novo projeto" : "Editar projeto"}
      </h1>

      <form onSubmit={handleSave} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" required value={title} onChange={(e) => { setTitle(e.target.value); if (isNew || !slug) setSlug(slugify(e.target.value)); }} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} maxLength={80} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input id="year" type="number" min={1990} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição / Comentário</Label>
          <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
        </div>

        <div className="space-y-2">
          <Label>Imagem de capa</Label>
          {coverUrl && (
            <img src={coverUrl} alt="Capa" className="h-40 w-full object-cover rounded-md bg-muted" />
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
            {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {coverUrl ? "Trocar capa" : "Enviar capa"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="published" className="cursor-pointer">Publicado</Label>
            <p className="text-xs text-muted-foreground">Visível no portfólio público.</p>
          </div>
          <Switch id="published" checked={published} onCheckedChange={setPublished} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </div>
      </form>

      {!isNew && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl">Galeria</h2>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> Adicionar imagens
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)} />
            </label>
          </div>
          {images && images.length > 0 ? (
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-md overflow-hidden bg-muted">
                  <img src={img.image_url} alt={img.caption || ""} className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => handleDeleteImage(img.id)} className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma imagem na galeria.</p>
          )}
        </div>
      )}
    </div>
  );
}