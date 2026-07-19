import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Shield, LogOut, LayoutDashboard, FolderKanban, Image as ImageIcon, MessageSquare, Plus, Trash2, Pencil, RefreshCw, Save, X, Check, Upload, Eye, EyeOff, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import {
  adminVerify, adminOverview, adminListProjects, adminUpsertProject, adminDeleteProject,
  adminListImages, adminUpsertImage, adminDeleteImage, adminBulkImportImages,
  adminListComments, adminSetCommentStatus, adminDeleteComment,
  adminGetSettings, adminUpdateSettings,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — AzGallery" },
      { name: "description", content: "لوحة إدارة معرض مشروعات العزب: المشروعات، الصور، الملاحظات، الإعدادات." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const KEY_STORAGE = "azgallery_admin_key";
type Tab = "overview" | "projects" | "images" | "comments" | "settings";

function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const k = sessionStorage.getItem(KEY_STORAGE);
    if (k) { setAdminKey(k); setAuthed(true); }
  }, []);

  if (!authed) return <LoginScreen onAuth={(k) => { sessionStorage.setItem(KEY_STORAGE, k); setAdminKey(k); setAuthed(true); }} />;
  return <Dashboard adminKey={adminKey} onLogout={() => { sessionStorage.removeItem(KEY_STORAGE); setAuthed(false); setAdminKey(""); }} />;
}

function LoginScreen({ onAuth }: { onAuth: (k: string) => void }) {
  const verify = useServerFn(adminVerify);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await verify({ data: { adminKey: key } });
      onAuth(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التحقق");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#030957] text-white">
          <Shield className="size-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold">لوحة إدارة AzGallery</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">أدخل مفتاح الإدارة للمتابعة</p>
        <label className="mt-6 block text-sm font-semibold">مفتاح الإدارة</label>
        <input
          type="password" value={key} onChange={(e) => setKey(e.target.value)} required autoFocus
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB900]"
          placeholder="AZGALLERY_ADMIN_KEY"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#030957] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "جارٍ التحقق..." : "دخول"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "projects", label: "المشروعات", icon: FolderKanban },
    { id: "images", label: "الصور", icon: ImageIcon },
    { id: "comments", label: "الملاحظات", icon: MessageSquare },
    { id: "settings", label: "الإعدادات", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#030957] text-white">
              <Shield className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">لوحة إدارة AzGallery</h1>
              <p className="text-xs text-muted-foreground">إعدادات وضبط المعرض</p>
            </div>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <LogOut className="size-4" /> خروج
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === t.id ? "border-[#FFB900] text-[#030957]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {tab === "overview" && <OverviewTab adminKey={adminKey} />}
        {tab === "projects" && <ProjectsTab adminKey={adminKey} />}
        {tab === "images" && <ImagesTab adminKey={adminKey} />}
        {tab === "comments" && <CommentsTab adminKey={adminKey} />}
        {tab === "settings" && <SettingsTab adminKey={adminKey} />}
      </div>
    </div>
  );
}

/* ----------------------------- OVERVIEW ----------------------------- */
function OverviewTab({ adminKey }: { adminKey: string }) {
  const fn = useServerFn(adminOverview);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminOverview>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try { setData(await fn({ data: { adminKey } })); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const cards = [
    { label: "إجمالي المشروعات", value: data?.projectCount ?? "—", color: "#030957" },
    { label: "المشروعات العامة", value: data?.publicCount ?? "—", color: "#0F9D58" },
    { label: "المشروعات الخاصة", value: data?.privateCount ?? "—", color: "#6B7280" },
    { label: "إجمالي الصور", value: data?.imageCount ?? "—", color: "#FFB900" },
    { label: "ملاحظات مفتوحة", value: data?.openComments ?? "—", color: "#DC2626" },
    { label: "إجمالي الملاحظات", value: data?.totalComments ?? "—", color: "#2563EB" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">نظرة عامة</h2>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>
      {err && <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- PROJECTS ----------------------------- */
type ProjectRow = {
  id: string; slug: string; name: string; description: string | null; location: string | null;
  cover_image_url: string | null; is_public: boolean; created_at: string; updated_at: string;
  image_count: number; open_comments: number;
};

function ProjectsTab({ adminKey }: { adminKey: string }) {
  const list = useServerFn(adminListProjects);
  const upsert = useServerFn(adminUpsertProject);
  const del = useServerFn(adminDeleteProject);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [editing, setEditing] = useState<Partial<ProjectRow> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true); setErr(null);
    try { const r = await list({ data: { adminKey } }); setProjects(r.projects as ProjectRow[]); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  async function save() {
    if (!editing) return;
    try {
      await upsert({ data: {
        adminKey, id: editing.id, slug: editing.slug ?? "", name: editing.name ?? "",
        description: editing.description ?? null, location: editing.location ?? null,
        cover_image_url: editing.cover_image_url ?? null, is_public: editing.is_public ?? true,
      }});
      setEditing(null); await load();
    } catch (e) { alert(e instanceof Error ? e.message : "خطأ"); }
  }

  async function remove(id: string) {
    if (!confirm("حذف المشروع نهائيًا مع كل صوره وملاحظاته؟")) return;
    await del({ data: { adminKey, id } }); await load();
  }

  const filtered = useMemo(() => projects.filter((p) =>
    !q.trim() || p.name.includes(q) || p.slug.includes(q) || (p.location ?? "").includes(q)
  ), [projects, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">إدارة المشروعات ({projects.length})</h2>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setEditing({ is_public: true, slug: "", name: "" })}
            className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="size-4" /> مشروع جديد
          </button>
        </div>
      </div>
      {err && <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-right">الاسم</th>
              <th className="px-4 py-3 text-right">Slug</th>
              <th className="px-4 py-3 text-right">الموقع</th>
              <th className="px-4 py-3 text-center">الحالة</th>
              <th className="px-4 py-3 text-center">الصور</th>
              <th className="px-4 py-3 text-center">ملاحظات</th>
              <th className="px-4 py-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${p.is_public ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {p.is_public ? <><Eye className="size-3" /> عام</> : <><EyeOff className="size-3" /> خاص</>}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{p.image_count}</td>
                <td className="px-4 py-3 text-center">
                  {p.open_comments > 0 ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{p.open_comments}</span> : <span className="text-muted-foreground">0</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <a href={`/project/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="فتح">
                      <ExternalLink className="size-4" />
                    </a>
                    <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="تعديل">
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => void remove(p.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="حذف">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">لا توجد مشروعات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل مشروع" : "إنشاء مشروع"}>
          <div className="space-y-3">
            <Field label="الاسم"><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Slug (بالإنجليزية)"><input className="input font-mono" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="الموقع"><input className="input" value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></Field>
            <Field label="صورة الغلاف (URL)"><input className="input" value={editing.cover_image_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} /></Field>
            <Field label="الوصف"><textarea className="input min-h-[100px]" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_public ?? true} onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })} />
              مشروع عام (يظهر للجميع)
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
            <button onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              <Save className="size-4" /> حفظ
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- IMAGES ----------------------------- */
type ImageRow = {
  id: string; project_id: string; image_url: string; caption: string | null;
  sort_order: number; captured_at: string | null; phase: string | null; created_at: string;
};

function ImagesTab({ adminKey }: { adminKey: string }) {
  const listProjects = useServerFn(adminListProjects);
  const listImages = useServerFn(adminListImages);
  const upsertImage = useServerFn(adminUpsertImage);
  const delImage = useServerFn(adminDeleteImage);
  const bulk = useServerFn(adminBulkImportImages);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [images, setImages] = useState<ImageRow[]>([]);
  const [editing, setEditing] = useState<Partial<ImageRow> | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPhase, setBulkPhase] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await listProjects({ data: { adminKey } });
      setProjects(r.projects as ProjectRow[]);
      if (r.projects[0]) setProjectId(r.projects[0].id);
    })();
    // eslint-disable-next-line
  }, []);

  async function loadImages() {
    if (!projectId) return;
    setLoading(true);
    const r = await listImages({ data: { adminKey, projectId } });
    setImages(r.images as ImageRow[]);
    setLoading(false);
  }
  useEffect(() => { void loadImages(); /* eslint-disable-next-line */ }, [projectId]);

  async function save() {
    if (!editing) return;
    await upsertImage({ data: {
      adminKey, id: editing.id, project_id: projectId,
      image_url: editing.image_url ?? "", caption: editing.caption ?? null,
      sort_order: editing.sort_order ?? 0,
      phase: (editing.phase as "start" | "execution" | "finishing" | "delivery" | null) ?? null,
      captured_at: editing.captured_at ?? null,
    }});
    setEditing(null); await loadImages();
  }

  async function remove(id: string) {
    if (!confirm("حذف الصورة؟")) return;
    await delImage({ data: { adminKey, id } }); await loadImages();
  }

  async function runBulk() {
    const urls = bulkText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (urls.length === 0) return;
    const r = await bulk({ data: { adminKey, projectId, urls, phase: (bulkPhase || null) as "start" | "execution" | "finishing" | "delivery" | null } });
    alert(`تم استيراد ${r.inserted} صورة`);
    setBulkOpen(false); setBulkText(""); await loadImages();
  }

  const phaseLabels: Record<string, string> = { start: "البداية", execution: "التنفيذ", finishing: "التشطيب", delivery: "التسليم" };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">إدارة الصور</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[200px]">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setBulkOpen(true)} disabled={!projectId} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <Upload className="size-4" /> استيراد جماعي
          </button>
          <button onClick={() => setEditing({ sort_order: images.length })} disabled={!projectId}
            className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            <Plus className="size-4" /> صورة جديدة
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading && <div className="col-span-full text-center text-muted-foreground py-12">جارٍ التحميل...</div>}
        {!loading && images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-square overflow-hidden bg-muted">
              <img src={img.image_url} alt={img.caption ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            </div>
            <div className="p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono">#{img.sort_order}</span>
                {img.phase && <span className="rounded bg-[#FFB900]/20 px-1.5 py-0.5 font-semibold text-[#030957]">{phaseLabels[img.phase] ?? img.phase}</span>}
              </div>
              {img.caption && <p className="mt-1 line-clamp-2 text-muted-foreground">{img.caption}</p>}
            </div>
            <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => setEditing(img)} className="rounded-lg bg-white/90 p-1.5 shadow hover:bg-white"><Pencil className="size-3.5" /></button>
              <button onClick={() => void remove(img.id)} className="rounded-lg bg-red-600 p-1.5 text-white shadow hover:bg-red-700"><Trash2 className="size-3.5" /></button>
            </div>
          </div>
        ))}
        {!loading && images.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">لا توجد صور لهذا المشروع</div>}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل صورة" : "إضافة صورة"}>
          <div className="space-y-3">
            <Field label="رابط الصورة"><input className="input" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
            <Field label="التسمية التوضيحية"><input className="input" value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الترتيب"><input type="number" className="input" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              <Field label="المرحلة">
                <select className="input" value={editing.phase ?? ""} onChange={(e) => setEditing({ ...editing, phase: e.target.value || null })}>
                  <option value="">— لا شيء —</option>
                  <option value="start">البداية</option>
                  <option value="execution">التنفيذ</option>
                  <option value="finishing">التشطيب</option>
                  <option value="delivery">التسليم</option>
                </select>
              </Field>
            </div>
            <Field label="تاريخ الالتقاط"><input type="date" className="input" value={editing.captured_at?.split("T")[0] ?? ""} onChange={(e) => setEditing({ ...editing, captured_at: e.target.value || null })} /></Field>
            {editing.image_url && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted"><img src={editing.image_url} alt="" className="max-h-48 w-full object-contain" /></div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
            <button onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><Save className="size-4" /> حفظ</button>
          </div>
        </Modal>
      )}

      {bulkOpen && (
        <Modal onClose={() => setBulkOpen(false)} title="استيراد جماعي للصور">
          <p className="text-sm text-muted-foreground">ألصق رابطًا لكل صورة في سطر منفصل.</p>
          <div className="mt-3">
            <Field label="المرحلة (اختياري)">
              <select className="input" value={bulkPhase} onChange={(e) => setBulkPhase(e.target.value)}>
                <option value="">— بدون —</option>
                <option value="start">البداية</option>
                <option value="execution">التنفيذ</option>
                <option value="finishing">التشطيب</option>
                <option value="delivery">التسليم</option>
              </select>
            </Field>
          </div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="mt-3 input min-h-[240px] font-mono text-xs" placeholder="https://.../image1.jpg&#10;https://.../image2.jpg" />
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setBulkOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
            <button onClick={() => void runBulk()} className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><Upload className="size-4" /> استيراد</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- COMMENTS ----------------------------- */
function CommentsTab({ adminKey }: { adminKey: string }) {
  const list = useServerFn(adminListComments);
  const setStatus = useServerFn(adminSetCommentStatus);
  const del = useServerFn(adminDeleteComment);
  const [status, setStatusFilter] = useState<"open" | "resolved" | "all">("open");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await list({ data: { adminKey, status } });
    setItems(r.comments); setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">ملاحظات العملاء ({items.length})</h2>
        <div className="flex items-center gap-2">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${status === s ? "bg-[#030957] text-white" : "border border-border bg-card hover:bg-muted"}`}>
              {s === "open" ? "مفتوحة" : s === "resolved" ? "مغلقة" : "الكل"}
            </button>
          ))}
          <button onClick={() => void load()} className="rounded-lg border border-border bg-card p-2 hover:bg-muted"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold">{c.visitor_name}</span>
                  {c.visitor_phone && <span className="text-muted-foreground">📞 {c.visitor_phone}</span>}
                  <span className="text-muted-foreground">·</span>
                  <a href={`/project/${c.projects?.slug}`} target="_blank" rel="noreferrer" className="text-[#030957] hover:underline">{c.projects?.name}</a>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString("ar-EG")}</span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${c.status === "open" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {c.status === "open" ? "مفتوحة" : "مغلقة"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{c.comment_text}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={async () => { await setStatus({ data: { adminKey, id: c.id, status: c.status === "open" ? "resolved" : "open" } }); void load(); }}
                  className="rounded-lg border border-border p-2 hover:bg-muted" title={c.status === "open" ? "إغلاق" : "إعادة فتح"}>
                  {c.status === "open" ? <Check className="size-4 text-green-600" /> : <X className="size-4" />}
                </button>
                <button onClick={async () => { if (confirm("حذف الملاحظة؟")) { await del({ data: { adminKey, id: c.id } }); void load(); } }}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">لا توجد ملاحظات</div>}
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */
function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="mt-4">{children}</div>
        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem}.input:focus{outline:none;box-shadow:0 0 0 2px #FFB900}`}</style>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}

/* ----------------------------- SETTINGS ----------------------------- */
type GallerySettings = {
  comments_enabled: boolean;
  positional_comments_enabled: boolean;
  require_visitor_phone: boolean;
  default_grid_columns: number;
  lightbox_autoplay: boolean;
  lightbox_show_thumbnails: boolean;
  show_phase_badges: boolean;
  show_capture_date: boolean;
  gallery_intro: string | null;
};

const DEFAULT_SETTINGS: GallerySettings = {
  comments_enabled: true,
  positional_comments_enabled: true,
  require_visitor_phone: false,
  default_grid_columns: 4,
  lightbox_autoplay: false,
  lightbox_show_thumbnails: true,
  show_phase_badges: true,
  show_capture_date: true,
  gallery_intro: "",
};

function SettingsTab({ adminKey }: { adminKey: string }) {
  const get = useServerFn(adminGetSettings);
  const update = useServerFn(adminUpdateSettings);
  const [s, setS] = useState<GallerySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true); setMsg(null);
    try {
      const r = await get({ data: { adminKey } });
      if (r.settings) setS({ ...DEFAULT_SETTINGS, ...r.settings, gallery_intro: r.settings.gallery_intro ?? "" });
    } catch (e) { setMsg({ type: "err", text: e instanceof Error ? e.message : "خطأ" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await update({ data: { adminKey, ...s, gallery_intro: s.gallery_intro || null } });
      setMsg({ type: "ok", text: "تم حفظ الإعدادات بنجاح." });
    } catch (e) { setMsg({ type: "err", text: e instanceof Error ? e.message : "تعذر الحفظ" }); }
    finally { setSaving(false); }
  }

  const Toggle = ({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-[#030957]" : "bg-gray-300"}`}
        aria-pressed={value}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${value ? "right-0.5" : "right-[calc(100%-1.375rem)]"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">إعدادات ضبط المعرض</h2>
          <p className="mt-1 text-sm text-muted-foreground">تحكّم في سلوك التعليقات وطريقة عرض الصور في المعرض.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> تحديث
          </button>
          <button onClick={() => void save()} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-[#030957] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            <Save className="size-4" /> {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg border p-3 text-sm ${msg.type === "ok" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#030957]">التعليقات</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle label="تفعيل التعليقات" hint="السماح للزوار بإضافة ملاحظات على الصور." value={s.comments_enabled} onChange={(v) => setS({ ...s, comments_enabled: v })} />
          <Toggle label="التعليقات الموضعية" hint="السماح بربط تعليق بموضع محدد داخل الصورة." value={s.positional_comments_enabled} onChange={(v) => setS({ ...s, positional_comments_enabled: v })} />
          <Toggle label="اشتراط رقم الهاتف" hint="إلزام الزائر بإدخال رقم للتواصل قبل إرسال التعليق." value={s.require_visitor_phone} onChange={(v) => setS({ ...s, require_visitor_phone: v })} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#030957]">عرض الصور</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">أعمدة الشبكة الافتراضية</div>
            <p className="mt-1 text-xs text-muted-foreground">عدد الأعمدة في شاشات سطح المكتب (1 - 8).</p>
            <input type="number" min={1} max={8} value={s.default_grid_columns}
              onChange={(e) => setS({ ...s, default_grid_columns: Math.min(8, Math.max(1, Number(e.target.value) || 4)) })}
              className="mt-3 w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <Toggle label="تشغيل تلقائي في صندوق العرض" hint="بدء عرض الصور تلقائيًا عند فتح lightGallery." value={s.lightbox_autoplay} onChange={(v) => setS({ ...s, lightbox_autoplay: v })} />
          <Toggle label="إظهار الصور المصغرة في صندوق العرض" value={s.lightbox_show_thumbnails} onChange={(v) => setS({ ...s, lightbox_show_thumbnails: v })} />
          <Toggle label="إظهار شارات المرحلة" hint="عرض شارة (بداية / تنفيذ / تشطيب / تسليم) على كل صورة." value={s.show_phase_badges} onChange={(v) => setS({ ...s, show_phase_badges: v })} />
          <Toggle label="إظهار تاريخ الالتقاط" value={s.show_capture_date} onChange={(v) => setS({ ...s, show_capture_date: v })} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#030957]">نص تعريفي للمعرض</h3>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs text-muted-foreground">يظهر في أعلى صفحة المشروعات كنص ترحيبي (اختياري).</p>
          <textarea value={s.gallery_intro ?? ""} onChange={(e) => setS({ ...s, gallery_intro: e.target.value })}
            className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="مرحبًا بكم في معرض مشروعات العزب..." />
        </div>
      </section>
    </div>
  );
}
