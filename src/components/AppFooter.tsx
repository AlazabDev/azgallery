import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Images, Mail, Phone, MapPin, Send, ExternalLink, ChevronLeft } from "lucide-react";

export function AppFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#030957] text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFB900] text-[#030957]">
                <Images className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xl font-extrabold text-white">AzGallery</span>
                <span className="block text-[10px] font-medium text-white/60">معرض مراجعة مشروعات العزب</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              منصة تفاعلية لمراجعة مشروعات العزب. تصفّح الصور، تابع التقدم الزمني، وأضِف ملاحظاتك مباشرة على أي جزء من الصورة.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#FFB900]">روابط سريعة</h3>
            <ul className="space-y-2.5">
              <FooterLink to="/" label="الرئيسية" />
              <FooterLink to="/projects" label="المشروعات" />
              <FooterLink to="/notes" label="الملاحظات المفتوحة" />
              <FooterLink to="/admin" label="لوحة الإدارة" />
            </ul>

          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#FFB900]">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB900]" />
                <span>القاهرة، جمهورية مصر العربية</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/70">
                <Phone className="h-4 w-4 shrink-0 text-[#FFB900]" />
                <span dir="ltr">+20 1XXX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/70">
                <Mail className="h-4 w-4 shrink-0 text-[#FFB900]" />
                <span>info@alazab.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#FFB900]">اشترك بالبريد</h3>
            <p className="text-sm text-white/60">
              احصل على آخر المستجدات والمشروعات الجديدة مباشرة على بريدك.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pr-10 pl-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#FFB900] focus:ring-1 focus:ring-[#FFB900]/30"
                />
                <button
                  type="submit"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#FFB900] px-3 py-1.5 text-[#030957] transition hover:bg-[#e5a700]"
                  aria-label="اشتراك"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-[#FFB900]">تم الاشتراك بنجاح! شكراً لك.</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} AzGallery — شركة العزب للمقاولات. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="transition hover:text-[#FFB900]">سياسة الخصوصية</Link>
            <Link to="/terms" className="transition hover:text-[#FFB900]">شروط الاستخدام</Link>
          </div>

        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center gap-1 text-sm text-white/70 transition hover:text-[#FFB900]"
      >
        <ChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
        {label}
      </Link>
    </li>
  );
}
