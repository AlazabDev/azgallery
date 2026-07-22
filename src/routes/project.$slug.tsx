import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { getProject, getImageComments, addComment } from "@/lib/gallery.functions";
import { getVisitorSession, getStoredVisitor, saveVisitor } from "@/lib/visitor-session";
import { ChevronRight, ChevronLeft, MessageSquare, MapPin, Expand, MapPinned, Send, X, ArrowRight, Calendar, Clock, Box, Paperclip, Link2, FileText } from "lucide-react";

const PHASE_ORDER = ["البداية", "التنفيذ", "التشطيب", "التسليم"] as const;
const PHASE_COLORS: Record<string, string> = {
  "البداية": "bg-blue-500",
  "التنفيذ": "bg-amber-500",
  "التشطيب": "bg-purple-500",
  "التسليم": "bg-emerald-500",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

const projectQuery = (slug: string) =>
  queryOptions({
    queryKey: ["project", slug],
    queryFn: () => getProject({ data: { slug } }),
  });

export const Route = createFileRoute("/project/$slug")({
  head: ({ loaderData }: { loaderData?: Awaited<ReturnType<typeof getProject>> }) => {
    const name = loaderData?.project?.name ?? "مشروع";
    return {
      meta: [
        { title: `${name} — AzGallery` },
        { name: "description", content: loaderData?.project?.description ?? "مراجعة صور المشروع" },
        { property: "og:title", content: `${name} — AzGallery` },
        { property: "og:description", content: loaderData?.project?.description ?? "" },
        ...(loaderData?.project?.cover_image_url
          ? [{ property: "og:image", content: loaderData.project.cover_image_url }]
          : []),
      ],
    };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(projectQuery(params.slug));
    if (!data.project) throw notFound();
    return data;
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(slug));
  const project = data.project!;
  const images = data.images;
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = images[activeIdx];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowRight className="size-4" /> العودة للمشروعات
          </Link>
        </div>
      </div>


      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Project info card */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card md:mb-6 md:p-6">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold md:text-3xl">{project.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground md:gap-4">
                {project.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="size-4 shrink-0" /> {project.location}</span>
                )}
                <span className="inline-flex items-center gap-1"><MessageSquare className="size-4 shrink-0" /> {images.length} صورة</span>
              </div>
            </div>
            {project.description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-right">{project.description}</p>}
          </div>
        </div>

        {images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            لا توجد صور في هذا المشروع بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px] md:gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            <GalleryPanel
              images={images}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              commentsByImage={data.commentsByImage}
            />
            <ReviewPanel image={activeImage} projectId={project.id} />
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2 md:gap-6">
          <ThreeDViewerCard />
          <AttachmentsCard />
        </div>
      </div>
    </div>
  );
}

type Img = { id: string; image_url: string; caption: string | null; sort_order: number; captured_at: string | null; phase: string | null };

function GalleryPanel({
  images,
  activeIdx,
  setActiveIdx,
  commentsByImage,
}: {
  images: Img[];
  activeIdx: number;
  setActiveIdx: (n: number) => void;
  commentsByImage: Record<string, number>;
}) {
  const active = images[activeIdx];
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const { data: commentsData } = useQuery({
    queryKey: ["image-comments", active.id],
    queryFn: () => getImageComments({ data: { imageId: active.id } }),
  });
  const markers = (commentsData?.comments ?? []).filter(
    (c) => c.position_x != null && c.position_y != null,
  );

  const openLightGallery = async () => {
    const lg = (await import("lightgallery")).default;
    const wrap = document.createElement("div");
    document.body.appendChild(wrap);
    const inst = lg(wrap, {
      dynamic: true,
      dynamicEl: images.map((i) => ({
        src: cldTransform(i.image_url, "f_auto,q_auto,c_limit,w_1920"),
        thumb: cldTransform(i.image_url, "f_auto,q_auto,c_fill,g_auto,w_240,h_240"),
        subHtml: i.caption ?? "",
      })),
      download: false,
      counter: true,
    });
    inst.openGallery(activeIdx);
    wrap.addEventListener("lgAfterClose", () => {
      inst.destroy();
      wrap.remove();
    });
  };

  const activeResp = responsiveImage(active.image_url);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div ref={imgWrapRef} data-pick-target="active-image" className="relative aspect-[16/10] overflow-hidden bg-black">
          <img
            src={activeResp.src}
            srcSet={activeResp.srcSet || undefined}
            sizes={activeResp.sizes}
            alt={active.caption ?? ""}
            loading="eager"
            decoding="async"
            className="h-full w-full object-contain"
          />
          {markers.map((m, i) => (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 translate-y-[-50%]"
              style={{ left: `${m.position_x}%`, top: `${m.position_y}%` }}
              title={m.comment_text}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shadow-elevated ring-2 ring-white">
                {i + 1}
              </div>
            </div>
          ))}

          <button
            onClick={() => setActiveIdx(activeIdx === 0 ? images.length - 1 : activeIdx - 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
            aria-label="السابق"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            onClick={() => setActiveIdx((activeIdx + 1) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
            aria-label="التالي"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur">
              {activeIdx + 1} / {images.length}
            </div>
            {active.phase && (
              <div className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-elevated ${PHASE_COLORS[active.phase] ?? "bg-primary"}`}>
                {active.phase}
              </div>
            )}
          </div>
          {active.captured_at && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur">
              <Calendar className="size-3.5" /> {formatDate(active.captured_at)}
            </div>
          )}
          <button
            onClick={openLightGallery}
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur transition hover:bg-black/80"
          >
            <Expand className="size-3.5" /> ملء الشاشة
          </button>
        </div>

        {active.caption && (
          <div className="border-t border-border bg-muted/40 px-4 py-3 text-sm">
            {active.caption}
          </div>
        )}
      </div>

      {/* Phase timeline progress */}
      <PhaseTimeline images={images} activeIdx={activeIdx} setActiveIdx={setActiveIdx} />

      {/* Thumbnails grouped by phase */}
      <div className="space-y-3">
        {PHASE_ORDER.filter((p) => images.some((i) => i.phase === p)).map((phase) => {
          const phaseImgs = images.map((img, idx) => ({ img, idx })).filter((x) => x.img.phase === phase);
          if (phaseImgs.length === 0) return null;
          return (
            <div key={phase}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full ${PHASE_COLORS[phase]}`} />
                <span className="text-xs font-bold text-foreground">{phase}</span>
                <span className="text-xs text-muted-foreground">({phaseImgs.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {phaseImgs.map(({ img, idx }) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      idx === activeIdx ? "border-primary shadow-elevated" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    {commentsByImage[img.id] > 0 && (
                      <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-md bg-accent/95 px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                        <MessageSquare className="size-2.5" /> {commentsByImage[img.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseTimeline({ images, activeIdx, setActiveIdx }: { images: Img[]; activeIdx: number; setActiveIdx: (n: number) => void }) {
  const present = PHASE_ORDER.filter((p) => images.some((i) => i.phase === p));
  if (present.length === 0) return null;
  const activePhase = images[activeIdx]?.phase;
  const progress = activePhase ? ((present.indexOf(activePhase as any) + 1) / present.length) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Clock className="size-3.5" /> التتابع الزمني للمشروع</span>
        <span>{images.length} لقطة</span>
      </div>
      <div className="relative">
        <div className="absolute right-0 left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        <div className="absolute right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-hero transition-all" style={{ width: `${progress}%` }} />
        <div className="relative flex items-center justify-between">
          {present.map((phase) => {
            const firstIdx = images.findIndex((i) => i.phase === phase);
            const isActive = activePhase === phase;
            const isPassed = present.indexOf(phase) <= present.indexOf((activePhase ?? present[0]) as any);
            return (
              <button
                key={phase}
                onClick={() => firstIdx >= 0 && setActiveIdx(firstIdx)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white transition ring-2 ring-card ${
                  isActive ? `${PHASE_COLORS[phase]} scale-125 shadow-elevated` : isPassed ? PHASE_COLORS[phase] : "bg-muted-foreground/40"
                }`}>●</span>
                <span className={`text-[11px] font-semibold transition ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{phase}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({ image, projectId }: { image: Img; projectId: string }) {
  const qc = useQueryClient();
  const addCommentFn = useServerFn(addComment);
  const { data } = useQuery({
    queryKey: ["image-comments", image.id],
    queryFn: () => getImageComments({ data: { imageId: image.id } }),
  });
  const comments = data?.comments ?? [];

  const stored = useMemo(() => getStoredVisitor(), [image.id]);
  const [name, setName] = useState(stored.name);
  const [phone, setPhone] = useState(stored.phone);
  const [text, setText] = useState("");
  const [pickMode, setPickMode] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset draft on image change
  useEffect(() => {
    setText("");
    setPos(null);
    setPickMode(false);
    setError(null);
  }, [image.id]);

  // Click-to-pick handler installed on the active image element
  useEffect(() => {
    if (!pickMode) return;
    const wrap = document.querySelector<HTMLDivElement>(
      `[data-pick-target="active-image"]`,
    );
    if (!wrap) return;
    const onClick = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const img = wrap.querySelector("img");
      if (!img) return;
      const imgRect = img.getBoundingClientRect();
      const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
      const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      setPos({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
      setPickMode(false);
    };
    wrap.style.cursor = "crosshair";
    wrap.addEventListener("click", onClick);
    return () => {
      wrap.style.cursor = "";
      wrap.removeEventListener("click", onClick);
    };
  }, [pickMode]);

  const mutation = useMutation({
    mutationFn: async () => {
      const session = getVisitorSession();
      return addCommentFn({
        data: {
          imageId: image.id,
          projectId,
          visitorName: name.trim(),
          visitorPhone: phone.trim() || null,
          visitorSession: session,
          commentText: text.trim(),
          positionX: pos?.x ?? null,
          positionY: pos?.y ?? null,
        },
      });
    },
    onSuccess: () => {
      saveVisitor(name.trim(), phone.trim());
      setText("");
      setPos(null);
      qc.invalidateQueries({ queryKey: ["image-comments", image.id] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const canSubmit = name.trim().length > 0 && text.trim().length > 0 && !mutation.isPending;

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">إضافة ملاحظة</h3>
          <span className="text-xs text-muted-foreground">بدون تسجيل دخول</span>
        </div>

        <div className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم *"
            maxLength={100}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف (اختياري)"
            maxLength={30}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="نص الملاحظة *"
            rows={3}
            maxLength={2000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                pickMode
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >
              <MapPinned className="size-3.5" />
              {pickMode ? "انقر على الصورة..." : "تحديد موضع بالصورة"}
            </button>
            {pos && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                موضع: {pos.x.toFixed(1)}% , {pos.y.toFixed(1)}%
                <button onClick={() => setPos(null)} aria-label="إزالة">
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            onClick={() => canSubmit && mutation.mutate()}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Send className="size-4" />
            {mutation.isPending ? "جاري الإرسال..." : "إرسال الملاحظة"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">ملاحظات هذه الصورة</h3>
          <span className="text-xs text-muted-foreground">{comments.length}</span>
        </div>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد ملاحظات بعد. كن أول من يضيف ملاحظة.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c, i) => {
              const posIdx =
                c.position_x != null
                  ? comments.filter((x, xi) => x.position_x != null && xi <= i).length
                  : null;
              return (
                <li key={c.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.visitor_name}</span>
                    {posIdx != null && (
                      <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-accent-foreground/80">
                        <MapPinned className="size-3" /> #{posIdx}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/90">{c.comment_text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

const THREE_D_VIEWER_URL =
  "https://3d.magicplan.app/#embed/?key=OWY4NTMxODc2NGJhMjA1MzlmNzc5NThmOTM2MTA3MDg3ODdjYmI4Y2QxZWMxMWMzZWVmYTE3MjRlNTM2NDdiNUOFXNR9vQaH%2FUjVv9jkjkX8pIA1i%2Br5XI5JElCn0LlkvhpDuYrczKGi29H%2B3uKrHYaHs4IFaXm%2FR6G2c4uJSK8Ypel%2BHlhFbX447CSO9SNS";

function ThreeDViewerCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Box className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">المخطط ثلاثي الأبعاد</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              استعراض تفاعلي للمساحات والتفاصيل الداخلية
            </p>
          </div>
        </div>

        <a
          href={THREE_D_VIEWER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted"
        >
          <Link2 className="size-3.5" />
          فتح مستقل
        </a>
      </div>

      <div className="relative min-h-[420px] bg-muted/30">
        <iframe
          src={THREE_D_VIEWER_URL}
          title="المخطط ثلاثي الأبعاد للمشروع"
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </section>
  );
}

type ProjectAttachment = {
  id: string;
  name: string;
  url: string;
  type?: string;
};

const PROJECT_ATTACHMENTS: ProjectAttachment[] = [];

function AttachmentsCard() {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Paperclip className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">مرفقات المشروع</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              المخططات والمستندات والملفات المرتبطة بالمشروع
            </p>
          </div>
        </div>

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {PROJECT_ATTACHMENTS.length} ملف
        </span>
      </div>

      <div className="p-5">
        {PROJECT_ATTACHMENTS.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
            <FileText className="mb-3 size-8 text-muted-foreground/60" />
            <p className="text-sm font-semibold">لا توجد مرفقات مضافة حاليًا</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ستظهر هنا المخططات والمستندات عند ربطها ببيانات المشروع.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {PROJECT_ATTACHMENTS.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 transition hover:bg-muted/60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {attachment.name}
                      </span>
                      {attachment.type && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {attachment.type}
                        </span>
                      )}
                    </span>
                  </span>
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

