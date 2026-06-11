import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — AzGallery" },
      { name: "description", content: "سياسة الخصوصية لمنصة AzGallery التابعة لشركة العزب للمقاولات." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخر تحديث: 2026</p>

        <div className="prose prose-slate mt-6 max-w-none space-y-5 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-bold">البيانات التي نجمعها</h2>
            <p>عند إضافة ملاحظة على صورة مشروع نقوم بحفظ الاسم ورقم الهاتف (اختياري) ونص الملاحظة، إضافة إلى معرّف جلسة مجهول لربط ملاحظاتك معًا.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">استخدام البيانات</h2>
            <p>تُستخدم البيانات فقط للتواصل بشأن المشروع المعني ومتابعة الملاحظات. لا نشاركها مع أي طرف ثالث لأغراض تسويقية.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">ملفات الكوكيز</h2>
            <p>نستخدم تخزينًا محليًا (localStorage) لحفظ معرّف الزائر فقط، ولا نستخدم كوكيز تتبّع.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold">حقوقك</h2>
            <p>يمكنك طلب حذف ملاحظاتك أو بياناتك في أي وقت بمراسلتنا على <a href="mailto:info@alazab.com" className="text-primary hover:underline">info@alazab.com</a>.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
