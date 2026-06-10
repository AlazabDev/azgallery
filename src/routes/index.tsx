import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/gallery.functions";
import { Images, MessageSquare, MapPin, ArrowLeft } from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AzGallery — معرض مراجعة مشروعات العزب" },
      { name: "description", content: "تصفّح بطاقات المشروعات وافتح المعرض لمراجعة الصور وإضافة الملاحظات." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 text-sm opacity-90">
            <div className="rounded-md bg-white/10 px-3 py-1 backdrop-blur">AzGallery</div>
            <span className="text-white/70">معرض مراجعة مشروعات العزب</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
            راجِع مشروعات العزب وأضِف ملاحظاتك على أي جزء من الصورة.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            افتح بطاقة المشروع، تصفّح الصور بدقة عالية، وحدّد الموضع المطلوب لكتابة ملاحظتك — بدون الحاجة لتسجيل دخول.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
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
