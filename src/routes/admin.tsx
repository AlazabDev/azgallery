import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — AzGallery" },
      { name: "description", content: "بوابة الدخول للوحة إدارة مشروعات العزب." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#030957] text-white">
            <Shield className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">لوحة الإدارة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            هذه المنطقة مخصّصة لفريق العزب للمقاولات لإدارة المشروعات والصور والمراجعات. للوصول، يلزم تسجيل الدخول بحساب مدير معتمد.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:info@alazab.com?subject=طلب%20صلاحية%20إدارة%20AzGallery"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFB900] px-5 py-3 text-sm font-semibold text-[#030957] transition hover:opacity-90"
            >
              طلب صلاحية وصول
            </a>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
