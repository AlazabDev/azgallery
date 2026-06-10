import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Search, Menu, X, Home, Images, MessageSquare, Phone, Mail } from "lucide-react";

export function AppHeader() {
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.navigate({ to: "/", search: { q: query.trim() } });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#030957] text-white">
            <Images className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-extrabold text-[#030957]">AzGallery</span>
            <span className="hidden sm:block text-[10px] font-medium text-gray-500">معرض مراجعة مشروعات العزب</span>
          </div>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مشروع..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-800 outline-none transition focus:border-[#FFB900] focus:ring-2 focus:ring-[#FFB900]/20 placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" icon={<Home className="h-4 w-4" />} label="الرئيسية" />
          <NavLink to="/" icon={<Images className="h-4 w-4" />} label="المشروعات" />
          <NavLink to="/" icon={<MessageSquare className="h-4 w-4" />} label="الملاحظات" />
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مشروع..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm outline-none focus:border-[#FFB900]"
            />
          </form>
          <div className="flex flex-col gap-1">
            <MobileNavLink to="/" icon={<Home className="h-4 w-4" />} label="الرئيسية" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink to="/" icon={<Images className="h-4 w-4" />} label="المشروعات" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink to="/" icon={<MessageSquare className="h-4 w-4" />} label="الملاحظات" onClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-[#030957]"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
    >
      {icon}
      {label}
    </Link>
  );
}
