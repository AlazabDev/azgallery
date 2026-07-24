import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/gallery.functions";
import { Images, MessageSquare, MapPin, ArrowLeft, Play, Building2, ShieldCheck } from "lucide-react";
import heroVideo from "@/assets/hero-construction.mp4.asset.json";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AzGallery — معرض مراجعة مشروعات العزب" },
      { name: "description", content: "تصفّح بطاقات المشروعات وافتح المعرض لمراجعة الصور وإضافة الملاحظات." },
      { property: "og:title", content: "AzGallery — معرض مراجعة مشروعات العزب" },
      { property: "og:description", content: "تصفّح بطاقات المشروعات وافتح المعرض لمراجعة الصور وإضافة الملاحظات." },
      { property: "og:url", content: "https://azgallery.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://azgallery.lovable.app/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: HomePage,
  pendingComponent: BrandSplash,
});

function BrandSplash() {
  return (
    <div className="az-splash" role="status" aria-live="polite">
      <div className="text-center">
        <div className="az-splash__mark">AzGallery</div>
        <div className="az-splash__sub">جاري تحميل المعرض…</div>
      </div>
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function HomePage() {
  const { data } = useSuspenseQuery(projectsQuery);
  const reducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative isolate overflow-hidden text-primary-foreground">
        {!reducedMotion && (
          <video
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src={heroVideo.url}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-bl from-[oklch(0.18_0.05_250/0.94)] via-[oklch(0.22_0.06_240/0.82)] to-[oklch(0.30_0.12_60/0.55)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.72_0.16_60/0.25),_transparent_60%)]" />

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[1.4fr,1fr] md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-md">
              <span className="inline-block size-2 rounded-full bg-accent animate-pulse-glow" />
              AzGallery — معرض مراجعة مشروعات العزب
            </div>
            <h1 className="mt-6 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-6xl">
              نبني الثقة بصورة <span className="text-accent">واضحة</span>،
              <br className="hidden md:block" />
              ونراجع التفاصيل <span className="text-accent">بدقة</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              تصفّح بطاقات مشروعات العزب، افتح المعرض بدقة عالية، وحدّد الموضع المطلوب لإضافة ملاحظاتك — بدون تسجيل دخول.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-elevated transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <Play className="size-4" /> استعراض المشروعات
              </a>
              <Link
                to="/projects"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                المعرض الكامل <ArrowLeft className="size-4" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2"><Building2 className="size-4 text-accent" /> {data.projects.length}+ مشروع</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> مراجعة بدون حساب</div>
              <div className="flex items-center gap-2"><Images className="size-4 text-accent" /> صور بدقة عالية</div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-accent/30 to-primary/30 blur-2xl" />
            <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img src="/alazab-icon.png" alt="شعار العزب" className="h-12 w-12 rounded-xl bg-white/10 p-1.5" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/70">حالة المعرض</div>
                  <div className="text-2xl font-bold">{data.projects.length} مشروع</div>
                </div>
              </div>
              <div className="mt-1 text-sm text-white/75">جاهز للمراجعة الآن</div>
              <div className="my-5 h-px bg-white/15" />
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> صور عالية الجودة لكل مشروع</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> تعليقات مرتبطة بموضع الصورة</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> عرض ثلاثي الأبعاد للمشروعات</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Projects Grid */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">المشروعات المتاحة</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.projects.length} مشروع جاهز للمراجعة
            </p>
          </div>
        </div>

        {data.projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            لا توجد مشروعات منشورة حتى الآن.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type Project = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  image_count: number;
  open_comments: number;
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/project/$slug"
      params={{ slug: project.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Images className="size-12" />
          </div>
        )}
        <div className="absolute bottom-0 right-0 left-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur">
            <Images className="size-3.5" /> {project.image_count}
          </span>
          {project.open_comments > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/90 px-2 py-1 text-accent-foreground">
              <MessageSquare className="size-3.5" /> {project.open_comments} ملاحظة
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          {project.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {project.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            فتح المعرض <ArrowLeft className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
