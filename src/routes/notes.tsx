import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "الملاحظات المفتوحة — AzGallery" },
      { name: "description", content: "تعرّف على آلية إضافة الملاحظات على صور المشروع في AzGallery." },
      { property: "og:title", content: "الملاحظات المفتوحة — AzGallery" },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
          <h1 className="text-3xl font-bold md:text-4xl">الملاحظات على المشروعات</h1>
          <p className="mt-3 max-w-2xl text-white/85">
            يمكنك مراجعة أي مشروع وإضافة ملاحظة دقيقة على أي جزء من الصورة، دون الحاجة لتسجيل دخول.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: 1, t: "افتح مشروعًا", d: "اختر المشروع المطلوب من قائمة المشروعات." },
            { n: 2, t: "حدّد الموضع", d: "اضغط على الصورة لتحديد النقطة التي تريد التعليق عليها." },
            { n: 3, t: "اكتب ملاحظتك", d: "أدخل اسمك ونص الملاحظة وأرسلها مباشرة." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                {s.n}
              </div>
              <h3 className="mt-3 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Link to="/projects" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            تصفّح المشروعات <ArrowLeft className="size-4" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <MessageSquare className="size-4" /> العودة للرئيسية
          </Link>
        </div>
      </section>
    </div>
  );
}
