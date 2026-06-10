
const MAGICPLAN_URL = "https://3d.magicplan.app/#embed/?key=OWY4NTMxODc2NGJhMjA1MzlmNzc5NThmOTM2MTA3MDg3ODdjYmI4Y2QxZWMxMWMzZWVmYTE3MjRlNTM2NDdiNUOFXNR9vQaH%2FUjVv9jkjkX8pIA1i%2Br5XI5JElCn0LlkvhpDuYrczKGi29H%2B3uKrHYaHs4IFaXm%2FR6G2c4uJSK8Ypel%2BHlhFbX447CSO9SNS";

function ThreeDViewerCard() {
  const [open, setOpen] = useState(false);
  const enterFull = () => {
    const el = document.getElementById("magicplan-iframe");
    if (el?.requestFullscreen) el.requestFullscreen();
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Box className="size-5" /></span>
          <div>
            <h3 className="font-bold leading-tight">العرض ثلاثي الأبعاد</h3>
            <p className="text-xs text-muted-foreground">استعرض المشروع تفاعلياً عبر MagicPlan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button onClick={enterFull} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">
              <Expand className="size-3.5" /> ملء الشاشة
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            {open ? "إخفاء" : "عرض النموذج"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="aspect-[16/10] w-full bg-black">
          <iframe
            id="magicplan-iframe"
            src={MAGICPLAN_URL}
            className="h-full w-full"
            allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
            allowFullScreen
            title="MagicPlan 3D"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/40 to-card p-6 text-center">
          <Box className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">اضغط "عرض النموذج" لتحميل التجربة ثلاثية الأبعاد للمشروع.</p>
        </div>
      )}
    </div>
  );
}

type Attachment = { id: string; kind: "file" | "link"; name: string; url: string };

function AttachmentsCard() {
  const [items, setItems] = useState<Attachment[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"file" | "link">("link");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addLink = () => {
    if (!linkUrl.trim()) return;
    setItems((x) => [...x, { id: crypto.randomUUID(), kind: "link", name: linkName.trim() || linkUrl.trim(), url: linkUrl.trim() }]);
    setLinkName(""); setLinkUrl(""); setOpen(false);
  };
  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(), kind: "file", name: f.name, url: URL.createObjectURL(f),
    }));
    setItems((x) => [...x, ...next]);
    setOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground"><Paperclip className="size-5" /></span>
          <div>
            <h3 className="font-bold leading-tight">الملفات والروابط</h3>
            <p className="text-xs text-muted-foreground">أرفق مستندات أو روابط مرجعية للمشروع</p>
          </div>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="size-3.5" /> {open ? "إغلاق" : "إضافة"}
        </button>
      </div>

      {open && (
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="mb-3 inline-flex rounded-md border border-border bg-background p-1 text-xs">
            <button onClick={() => setTab("link")} className={`rounded px-3 py-1.5 font-semibold ${tab === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Link2 className="ml-1 inline size-3.5" /> رابط
            </button>
            <button onClick={() => setTab("file")} className={`rounded px-3 py-1.5 font-semibold ${tab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <FileText className="ml-1 inline size-3.5" /> ملف
            </button>
          </div>
          {tab === "link" ? (
            <div className="space-y-2">
              <input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="اسم الرابط (اختياري)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={addLink} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="size-3.5" /> إضافة الرابط
              </button>
            </div>
          ) : (
            <div>
              <input ref={fileRef} type="file" multiple onChange={(e) => onFiles(e.target.files)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground hover:bg-muted">
                <FileText className="size-4" /> اختر ملفات للرفع
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد ملفات أو روابط بعد.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                <a href={it.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm hover:text-primary">
                  {it.kind === "link" ? <Link2 className="size-4 shrink-0 text-primary" /> : <FileText className="size-4 shrink-0 text-primary" />}
                  <span className="truncate">{it.name}</span>
                </a>
                <button onClick={() => setItems((x) => x.filter((y) => y.id !== it.id))} className="text-muted-foreground hover:text-destructive" aria-label="حذف">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
