import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/gallery.functions";
import { Images, MapPin, ArrowLeft } from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "المشروعات — AzGallery" },
      { name: "description", content: "تصفّح كل مشروعات شركة العزب للمقاولات مع متابعة التتابع الزمني للصور." },
      { property: "og:title", content: "المشروعات — AzGallery" },
      { property: "og:description", content: "كل مشروعات العزب في مكان واحد." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold md:text-4xl">جميع المشروعات</h1>
          <p className="mt-3 max-w-2xl text-white/85">
            {data.projects.length} مشروع متاح للمراجعة. اضغط على أي بطاقة للاطلاع على الصور.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {data.projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            لا توجد مشروعات منشورة حتى الآن.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((p) => (
              <Link
                key={p.id}
                to="/project/$slug"
                params={{ slug: p.slug }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Images className="size-10" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-lg font-bold">{p.name}</h3>
                  {p.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {p.location}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    عرض المشروع <ArrowLeft className="size-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
