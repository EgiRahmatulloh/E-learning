import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

// Separate ClockBadge component to completely isolate render scope and prevent Header re-renders
function ClockBadge({ isScrolled }: { isScrolled: boolean }) {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className={`backdrop-blur-md px-4 py-1.5 rounded-2xl border transition-all duration-300 ${
      isScrolled 
        ? "bg-[#280f91]/90 text-white border-white/10 shadow-md shadow-[#280f91]/20" 
        : "bg-white/15 text-white border-white/20 shadow-xs"
    }`}>
      <div className="text-[9px] font-extrabold tracking-wider uppercase text-center opacity-90">
        {formatDate(dateTime)}
      </div>
      <div className="text-sm font-black tracking-widest text-center tabular-nums leading-none mt-0.5">
        {formatTime(dateTime)}
      </div>
    </div>
  );
}

interface HeaderProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export default function Header({ currentPath = "/", onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(currentPath === "/profile" || currentPath === "/agenda" || currentPath === "/news" || currentPath === "/tutor" || currentPath === "/warga-belajar" || currentPath === "/download");

  useEffect(() => {
    if (currentPath === "/profile" || currentPath === "/agenda" || currentPath === "/news" || currentPath === "/tutor" || currentPath === "/warga-belajar" || currentPath === "/download") {
      setIsScrolled(true);
      return;
    }
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPath]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (targetId === "profil" || targetId === "agenda" || targetId === "berita" || targetId === "tutor" || targetId === "warga-belajar" || targetId === "download") {
      const path = targetId === "profil" ? "/profile" : targetId === "agenda" ? "/agenda" : targetId === "berita" ? "/news" : targetId === "tutor" ? "/tutor" : targetId === "warga-belajar" ? "/warga-belajar" : "/download";
      if (onNavigate) {
        onNavigate(path);
      } else {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      setMobileMenuOpen(false);
    } else {
      if (currentPath !== "/") {
        if (onNavigate) {
          onNavigate("/");
        } else {
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate("/");
    } else {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-0" 
        : "bg-transparent border-b border-transparent py-2"
    }`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12 object-contain"
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
          <a href="#beranda" onClick={(e) => handleNavClick(e, "beranda")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-[#280f91] hover:text-[#ff6105]" : "text-white hover:text-orange-400"}`}>Beranda</a>
          <a href="#profil" onClick={(e) => handleNavClick(e, "profil")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/profile" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Profil</a>
          <a href="#agenda" onClick={(e) => handleNavClick(e, "agenda")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/agenda" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Agenda</a>
          <a href="#berita" onClick={(e) => handleNavClick(e, "berita")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/news" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Berita</a>
          <a href="#tutor" onClick={(e) => handleNavClick(e, "tutor")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/tutor" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Tutor</a>
          <a href="#warga-belajar" onClick={(e) => handleNavClick(e, "warga-belajar")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/warga-belajar" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Warga Belajar</a>
          <a href="#download" onClick={(e) => handleNavClick(e, "download")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? (currentPath === "/download" ? "text-[#ff6105]" : "text-slate-600 hover:text-[#280f91]") : "text-white/80 hover:text-white"}`}>Download</a>
          <a href="#produk" onClick={(e) => handleNavClick(e, "produk")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Produk Warga Belajar</a>
          <a href="#alumni" onClick={(e) => handleNavClick(e, "alumni")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Alumni</a>
          <a href="#galeri" onClick={(e) => handleNavClick(e, "galeri")} className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-[#280f91]" : "text-white/80 hover:text-white"}`}>Galeri</a>
        </nav>

        {/* Desktop Date/Time Badge (Isolated Component) */}
        <div className="hidden lg:block shrink-0">
          <ClockBadge isScrolled={isScrolled} />
        </div>

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
            <a href="#beranda" onClick={(e) => handleNavClick(e, "beranda")} className="text-base font-bold text-[#280f91]">Beranda</a>
            <a href="#profil" onClick={(e) => handleNavClick(e, "profil")} className="text-base font-semibold text-[#280f91]">Profil</a>
            <a href="#agenda" onClick={(e) => handleNavClick(e, "agenda")} className="text-base font-semibold text-slate-600">Agenda</a>
            <a href="#berita" onClick={(e) => handleNavClick(e, "berita")} className="text-base font-semibold text-slate-600">Berita</a>
            <a href="#tutor" onClick={(e) => handleNavClick(e, "tutor")} className="text-base font-semibold text-slate-600">Tutor</a>
            <a href="#warga-belajar" onClick={(e) => handleNavClick(e, "warga-belajar")} className="text-base font-semibold text-slate-600">Warga Belajar</a>
            <a href="#download" onClick={(e) => handleNavClick(e, "download")} className="text-base font-semibold text-slate-600">Download</a>
            <a href="#produk" onClick={(e) => handleNavClick(e, "produk")} className="text-base font-semibold text-slate-600">Produk Warga Belajar</a>
            <a href="#alumni" onClick={(e) => handleNavClick(e, "alumni")} className="text-base font-semibold text-slate-600">Alumni</a>
            <a href="#galeri" onClick={(e) => handleNavClick(e, "galeri")} className="text-base font-semibold text-slate-600">Galeri</a>
          </nav>
        </div>
      )}
    </header>
  );
}
