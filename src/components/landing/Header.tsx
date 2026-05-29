import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12"
          />
          <div>
            <span className="block text-xs font-bold tracking-widest text-[#ff6105] uppercase">Website Resmi</span>
            <span className="text-lg font-black tracking-tight text-[#280f91]">PKBM MENUJU MAKMUR</span>
          </div>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#beranda" className="text-sm font-semibold text-[#280f91] hover:text-[#ff6105] transition-colors">Beranda</a>
          <a href="#profil" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Profil</a>
          <a href="#layanan" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Layanan Digital</a>
          <a href="#agenda" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Agenda</a>
          <a href="#berita" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Berita</a>
          <a href="#produk" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Produk</a>
          <a href="#tutor" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Tutor</a>
          <a href="#alumni" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Alumni</a>
          <a href="#kontak" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Kontak</a>
        </nav>

        {/* E-Learning Quick Access & Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Button asChild className="rounded-full bg-[#280f91] text-white hover:bg-[#ff6105] transition-all font-bold px-5 shadow-md shadow-[#280f91]/20 group cursor-pointer">
            <a href="#layanan">
              Portal Belajar
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden animate-in fade-in slide-in-from-top duration-300 bg-white border-b border-slate-200 px-4 py-6 space-y-4">
          <nav className="flex flex-col gap-4">
            <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-[#280f91]">Beranda</a>
            <a href="#profil" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Profil</a>
            <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Layanan Digital</a>
            <a href="#agenda" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Agenda</a>
            <a href="#berita" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Berita</a>
            <a href="#produk" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Produk Warga Belajar</a>
            <a href="#tutor" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Tutor</a>
            <a href="#alumni" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Alumni</a>
            <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Kontak</a>
          </nav>
          <Separator />
          <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="block">
            <Button className="w-full rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 mb-2 cursor-pointer">
              Akses E-Learning
            </Button>
          </a>
        </div>
      )}
    </header>
  );
}
