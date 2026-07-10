import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Cloud, DownloadCloud, ExternalLink, Image as ImageIcon, RefreshCw, Search, Shield, X } from "lucide-react";
import {
  adminBulkImportImages,
  adminListCloudinaryImages,
  adminListProjects,
  adminVerify,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/cloudinary")({
  head: () => ({
    meta: [
      { title: "Cloudinary — AzGallery" },
      { name: "description", content: "استعراض واستيراد صور Cloudinary إلى مشروعات AzGallery." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CloudinaryPage,
});

const KEY_STORAGE = "azgallery_admin_key";
const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FFB900]";
type Phase = "start" | "execution" | "finishing" | "delivery";
type CloudinaryImage = Awaited<ReturnType<typeof adminListCloudinaryImages>>["images"][number];
type ProjectOption = Awaited<ReturnType<typeof adminListProjects>>["projects"][number];

function CloudinaryPage() {
  const verify = useServerFn(adminVerify);
  const listProjects = useServerFn(adminListProjects);
  const listCloudinary = useServerFn(adminListCloudinaryImages);
  const bulkImport = useServerFn(adminBulkImportImages);

  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginKey, setLoginKey] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [phase, setPhase] = useState<"" | Phase>("");
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(KEY_STORAGE);
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed || !adminKey) return;
    void (async () => {
      try {
        const result = await listProjects({ data: { adminKey } });
        setProjects(result.projects);
        if (result.projects[0]) setProjectId(result.projects[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تحميل المشروعات");
      }
    })();
  }, [authed, adminKey, listProjects]);

  const selectedImages = useMemo(
    () => images.filter((image) => selected.has(image.public_id)),
    [images, selected],
  );

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      await verify({ data: { adminKey: loginKey } });
      sessionStorage.setItem(KEY_STORAGE, loginKey);
      setAdminKey(loginKey);
      setAuthed(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "فشل التحقق");
    }
  }

  async function loadCloudinary() {
    setLoading(true);
    setError(null);
    try {
      const result = await listCloudinary({ data: { adminKey, prefix, maxResults } });
      setImages(result.images);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل صور Cloudinary");
    } finally {
      setLoading(false);
    }
  }

  function toggle(publicId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(images.map((image) => image.public_id)));
  }

  async function importSelected() {
    if (!projectId) {
      setError("اختر مشروعًا قبل الاستيراد.");
      return;
    }
    if (selectedImages.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const urls = selectedImages.map((image) => image.display_url);
      const result = await bulkImport({
        data: {
          adminKey,
          projectId,
          urls,
          phase: (phase || null) as Phase | null,
        },
      });
      alert(`تم استيراد ${result.inserted} صورة من Cloudinary`);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل استيراد الصور");
    } finally {
      setImporting(false);
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
        <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#030957] text-white">
            <Shield className="size-7" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">Cloudinary — AzGallery</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">أدخل مفتاح الإدارة لاستعراض الصور واستيرادها.</p>
          <label className="mt-6 block text-sm font-semibold">مفتاح الإدارة</label>
          <input
            type="password"
            value={loginKey}
            onChange={(event) => setLoginKey(event.target.value)}
            required
            autoFocus
            className={`mt-2 w-full ${inputClass}`}
            placeholder="AZGALLERY_ADMIN_KEY"
          />
          {loginError && <p className="mt-3 text-sm text-red-600">{loginError}</p>}
          <button type="submit" className="mt-6 w-full rounded-xl bg-[#030957] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            دخول
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#030957] text-white">
              <Cloud className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold">صور Cloudinary</h1>
              <p className="text-xs text-muted-foreground">استعراض الأصول السحابية واستيراد المختار إلى المشروع.</p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted">
            <ArrowRight className="size-4" /> لوحة الإدارة
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr_auto_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Cloudinary prefix / folder</span>
              <input
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                className={`w-full ${inputClass}`}
                placeholder="مثال: azgallery/projects"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">عدد النتائج</span>
              <input
                type="number"
                min={1}
                max={100}
                value={maxResults}
                onChange={(event) => setMaxResults(Math.min(100, Math.max(1, Number(event.target.value) || 50)))}
                className={`w-full ${inputClass}`}
              />
            </label>
            <button
              type="button"
              onClick={() => void loadCloudinary()}
              disabled={loading}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 lg:mt-6"
            >
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
              عرض الصور
            </button>
            <button
              type="button"
              onClick={selected.size === images.length ? () => setSelected(new Set()) : selectAllVisible}
              disabled={images.length === 0}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 lg:mt-6"
            >
              {selected.size === images.length && images.length > 0 ? <X className="size-4" /> : <Check className="size-4" />}
              {selected.size === images.length && images.length > 0 ? "إلغاء الكل" : "تحديد الكل"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">المشروع المستهدف</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={`w-full ${inputClass}`}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">المرحلة</span>
              <select value={phase} onChange={(event) => setPhase(event.target.value as "" | Phase)} className={`w-full ${inputClass}`}>
                <option value="">بدون</option>
                <option value="start">البداية</option>
                <option value="execution">التنفيذ</option>
                <option value="finishing">التشطيب</option>
                <option value="delivery">التسليم</option>
              </select>
            </label>
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <div className="text-xs text-muted-foreground">المحدد</div>
              <div className="text-2xl font-bold text-[#030957]">{selectedImages.length}</div>
            </div>
            <button
              type="button"
              onClick={() => void importSelected()}
              disabled={selectedImages.length === 0 || importing || !projectId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFB900] px-4 py-2 text-sm font-bold text-[#030957] hover:opacity-90 disabled:opacity-50"
            >
              <DownloadCloud className="size-4" />
              {importing ? "جاري الاستيراد..." : "استيراد المحدد"}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading && <div className="col-span-full py-16 text-center text-muted-foreground">جاري تحميل صور Cloudinary...</div>}
          {!loading && images.map((image) => {
            const isSelected = selected.has(image.public_id);
            return (
              <article key={image.public_id} className={`group overflow-hidden rounded-2xl border bg-card shadow-sm transition ${isSelected ? "border-[#FFB900] ring-2 ring-[#FFB900]/50" : "border-border"}`}>
                <button type="button" onClick={() => toggle(image.public_id)} className="block w-full text-right">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img src={image.thumbnail_url} alt={image.filename} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-bold ${isSelected ? "bg-[#FFB900] text-[#030957]" : "bg-black/60 text-white"}`}>
                      {isSelected ? "محدد" : "اختيار"}
                    </span>
                  </div>
                </button>
                <div className="space-y-2 p-3 text-xs">
                  <div className="line-clamp-2 font-mono text-[11px] text-foreground" title={image.public_id}>{image.public_id}</div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{image.width ?? "—"}×{image.height ?? "—"}</span>
                    <span>{image.format || "image"}</span>
                  </div>
                  <a href={image.original_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#030957] hover:underline">
                    <ExternalLink className="size-3" /> فتح الأصل
                  </a>
                </div>
              </article>
            );
          })}
          {!loading && images.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
              <ImageIcon className="mx-auto mb-3 size-10 opacity-60" />
              لا توجد صور معروضة. اكتب prefix أو اتركه فارغًا ثم اضغط عرض الصور.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
