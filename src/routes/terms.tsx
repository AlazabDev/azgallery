import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام — AzGallery" },
      { name: "description", content: "شروط استخدام منصة AzGallery." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <h1 className="text-3xl font-bold">شروط الاستخدام</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخر تحديث: 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-bold">قبول الشروط</h2>
            <p>باستخدامك لمنصة AzGallery فإنك توافق على هذه الشروط. إذا كنت لا توافق، يُرجى عدم استخدام المنصة.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">الاستخدام المسموح</h2>
            <p>المنصة مخصصة لمراجعة مشروعات شركة العزب للمقاولات وإضافة ملاحظات بناءة فقط. يُحظر نشر أي محتوى مسيء أو غير قانوني.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">الملكية الفكرية</h2>
            <p>جميع الصور والمحتوى المعروض ملك لشركة العزب للمقاولات. لا يُسمح بإعادة استخدامها دون إذن خطي.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">إخلاء المسؤولية</h2>
            <p>تُقدَّم المنصة "كما هي" دون أي ضمانات. شركة العزب غير مسؤولة عن أي خسارة ناتجة عن سوء الاستخدام.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
