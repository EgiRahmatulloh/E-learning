import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-0" 
        : "bg-transparent border-b border-transparent py-2"
    }`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12"
          />
          <div>
            <span className={`block text-sm font-extrabold tracking-widest transition-colors duration-300 ${
              isScrolled ? "text-[#ff6105]" : "text-white"
            }`}>
              PKBM
            </span>
            <span className={`text-lg font-black tracking-tight transition-colors duration-300 ${
              isScrolled ? "text-[#280f91]" : "text-white"
            }`} style={{ textShadow: isScrolled ? "none" : "0 2px 10px rgba(0,0,0,0.4)" }}>
              MENUJU MAKMUR
            </span>
          </div>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          <a href="#beranda" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-[#280f91] hover:text-[#ff6105]" : "text-white hover:text-orange-400"}`}>Beranda</a>
          <a href="#profil" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Profil</a>
          <a href="#agenda" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Agenda</a>
          <a href="#berita" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Berita</a>
          <a href="#tutor" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Tutor</a>
          <a href="#download" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Download</a>
          <a href="#produk" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Produk Warga Belajar</a>
          <a href="#alumni" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Alumni</a>
          <a href="#galeri" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Galeri</a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300 lg:hidden cursor-pointer ${
            isScrolled 
              ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" 
              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden animate-in fade-in slide-in-from-top duration-300 bg-white border-b border-slate-200 px-4 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col gap-4">
            <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-[#280f91]">Beranda</a>
            <a href="#profil" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Profil</a>
            <a href="#agenda" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Agenda</a>
            <a href="#berita" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Berita</a>
            <a href="#tutor" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Tutor</a>
            <a href="#download" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Download</a>
            <a href="#produk" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Produk Warga Belajar</a>
            <a href="#alumni" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Alumni</a>
            <a href="#galeri" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Galeri</a>
          </nav>
        </div>
      )}
    </header>
  );
}
