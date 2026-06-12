import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listProjects } from "@/lib/gallery.functions";
import {
  Images,
  MapPin,
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  SlidersHorizontal,
  X,
  Sparkles,
} from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "معرض المشروعات — AzGallery" },
      {
        name: "description",
        content:
          "معرض احترافي لجميع مشروعات شركة العزب للمقاولات مع بحث، تصفية، وفرز متقدّم.",
      },
      { property: "og:title", content: "معرض المشروعات — AzGallery" },
      {
        property: "og:description",
        content: "كل مشروعات العزب في مكان واحد بعرض احترافي.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: ProjectsPage,
});

type SortKey = "newest" | "oldest" | "most_images" | "name";
type ViewMode = "grid" | "masonry" | "list";

function ProjectsPage() {
  const { data } = useSuspenseQuery(projectsQuery);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [onlyWithComments, setOnlyWithComments] = useState(false);

  const locations = useMemo(() => {
    const s = new Set<string>();
    data.projects.forEach((p) => p.location && s.add(p.location));
    return ["all", ...Array.from(s)];
  }, [data.projects]);

  const filtered = useMemo(() => {
    let list = data.projects.slice();
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q),
      );
    }
    if (location !== "all") list = list.filter((p) => p.location === location);
    if (onlyWithComments) list = list.filter((p) => p.open_comments > 0);

    switch (sort) {
      case "oldest":
        list.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
        break;
      case "most_images":
        list.sort((a, b) => b.image_count - a.image_count);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        break;
      default:
        list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return list;
  }, [data.projects, query, location, sort, onlyWithComments]);

  const totalImages = data.projects.reduce((s, p) => s + p.image_count, 0);
  const totalComments = data.projects.reduce((s, p) => s + p.open_comments, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="size-3.5" /> معرض المشروعات الاحترافي
          </div>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">
            استعرض أعمال العزب بتجربة معرض متكاملة
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            ابحث، صفّي، وافرز بين كل المشروعات. شاهد العدد الكامل للصور والملاحظات
            المفتوحة، وافتح أي مشروع للمراجعة بدقة.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            <Stat label="مشروع" value={data.projects.length} />
            <Stat label="صورة" value={totalImages} />
            <Stat label="ملاحظة مفتوحة" value={totalComments} />
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:px-6">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المشروع أو الوصف أو الموقع…"
              className="w-full rounded-xl border border-border bg-card pr-9 pl-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="مسح"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "كل المواقع" : l}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="most_images">الأكثر صورًا</option>
              <option value="name">حسب الاسم</option>
            </select>

            <button
              onClick={() => setOnlyWithComments((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                onlyWithComments
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              لها ملاحظات
            </button>

            <div className="flex overflow-hidden rounded-xl border border-border bg-card">
              <ViewBtn active={view === "grid"} onClick={() => setView("grid")} label="شبكي">
                <LayoutGrid className="size-4" />
              </ViewBtn>
              <ViewBtn
                active={view === "masonry"}
                onClick={() => setView("masonry")}
                label="ميزوني"
              >
                <Images className="size-4" />
              </ViewBtn>
              <ViewBtn active={view === "list"} onClick={() => setView("list")} label="قائمة">
                <List className="size-4" />
              </ViewBtn>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            عرض <span className="font-semibold text-foreground">{filtered.length}</span> من{" "}
            {data.projects.length} مشروع
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setQuery(""); setLocation("all"); setOnlyWithComments(false); }} />
        ) : view === "list" ? (
          <div className="flex flex-col gap-4">
            {filtered.map((p) => <ListCard key={p.id} p={p} />)}
          </div>
        ) : view === "masonry" ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
            {filtered.map((p) => <MasonryCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => <GridCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

type P = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  created_at?: string;
  image_count: number;
  open_comments: number;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="text-2xl font-extrabold">{value.toLocaleString("ar-EG")}</div>
      <div className="text-xs text-white/80">{label}</div>
    </div>
  );
}

function ViewBtn({
  active, onClick, label, children,
}: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`px-3 py-2.5 text-sm transition ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function CoverBadges({ p }: { p: P }) {
  return (
    <div className="absolute bottom-2 right-2 left-2 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur">
        <Images className="size-3" /> {p.image_count}
      </span>
      {p.open_comments > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-accent/90 px-2 py-1 text-[11px] text-accent-foreground">
          <MessageSquare className="size-3" /> {p.open_comments}
        </span>
      )}
      {p.location && (
        <span className="ms-auto inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[11px] text-foreground">
          <MapPin className="size-3" /> {p.location}
        </span>
      )}
    </div>
  );
}

function GridCard({ p }: { p: P }) {
  return (
    <Link
      to="/project/$slug"
      params={{ slug: p.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <Fallback />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-90" />
        <CoverBadges p={p} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-foreground">{p.name}</h3>
        {p.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        )}
        <div className="mt-auto inline-flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">جاهز للمراجعة</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-2">
            افتح <ArrowLeft className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function MasonryCard({ p }: { p: P }) {
  // Vary aspect ratio for visual rhythm
  const ratios = ["aspect-[4/5]", "aspect-[4/3]", "aspect-[3/4]", "aspect-[16/10]"];
  const ratio = ratios[(p.id.charCodeAt(0) + p.image_count) % ratios.length];
  return (
    <Link
      to="/project/$slug"
      params={{ slug: p.slug }}
      className="group block break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-elevated"
    >
      <div className={`relative ${ratio} overflow-hidden bg-muted`}>
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <Fallback />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-3 text-white">
          <h3 className="line-clamp-1 text-sm font-bold">{p.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-[11px] opacity-90">
            <span className="inline-flex items-center gap-1">
              <Images className="size-3" /> {p.image_count}
            </span>
            {p.open_comments > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3" /> {p.open_comments}
              </span>
            )}
            {p.location && (
              <span className="ms-auto inline-flex items-center gap-1">
                <MapPin className="size-3" /> {p.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ p }: { p: P }) {
  return (
    <Link
      to="/project/$slug"
      params={{ slug: p.slug }}
      className="group grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-elevated sm:grid-cols-[260px_minmax(0,1fr)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted sm:aspect-auto">
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <Fallback />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 p-5">
        <h3 className="truncate text-lg font-bold">{p.name}</h3>
        {p.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
            <Images className="size-3" /> {p.image_count} صورة
          </span>
          {p.open_comments > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-accent-foreground">
              <MessageSquare className="size-3" /> {p.open_comments} ملاحظة
            </span>
          )}
          {p.location && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <MapPin className="size-3" /> {p.location}
            </span>
          )}
          <span className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-2">
            افتح المعرض <ArrowLeft className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Fallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
      <Images className="size-10" />
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-5" />
      </div>
      <h3 className="text-lg font-bold">لا توجد مشروعات مطابقة</h3>
      <p className="mt-1 text-sm text-muted-foreground">جرّب تعديل البحث أو إزالة الفلاتر.</p>
      <button
        onClick={onReset}
        className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        إعادة ضبط
      </button>
    </div>
  );
}
