import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Globe,
  BookOpen,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Type,
  Megaphone,
  User,
  CalendarDays,
  Newspaper,
  Users,
  GraduationCap,
  Download,
  ShoppingBag,
  Award,
  Image,
  Eye,
  UserCheck,
  BookOpenCheck,
  FileCheck,
  UserPlus,
} from "lucide-react";
import { AdminDashboard } from "./admin/AdminDashboard";
import { TutorDashboard } from "./tutor/TutorDashboard";
import { SiswaDashboard } from "./siswa/SiswaDashboard";

interface DashboardPageProps {
  user: { id: number; name: string; username: string; role: string; email?: string };
  handleLogout: () => void;
}

// Sidebar menu item type
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string; icon: React.ReactNode }[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "website",
    label: "WEBSITE",
    icon: <Globe className="h-5 w-5" />,
    children: [
      { id: "header", label: "HEADER", icon: <Type className="h-4 w-4" /> },
      { id: "pengumuman", label: "PENGUMUMAN", icon: <Megaphone className="h-4 w-4" /> },
      { id: "profil", label: "PROFIL", icon: <User className="h-4 w-4" /> },
      { id: "agenda", label: "AGENDA", icon: <CalendarDays className="h-4 w-4" /> },
      { id: "berita", label: "BERITA", icon: <Newspaper className="h-4 w-4" /> },
      { id: "tutor", label: "TUTOR", icon: <GraduationCap className="h-4 w-4" /> },
      { id: "warga-belajar", label: "WARGA BELAJAR", icon: <Users className="h-4 w-4" /> },
      { id: "download", label: "DOWNLOAD", icon: <Download className="h-4 w-4" /> },
      { id: "produk-wb", label: "PRODUK WB", icon: <ShoppingBag className="h-4 w-4" /> },
      { id: "alumni", label: "ALUMNI", icon: <Award className="h-4 w-4" /> },
      { id: "galeri", label: "GALERI", icon: <Image className="h-4 w-4" /> },
    ],
  },
  {
    id: "e-learning",
    label: "E-LEARNING",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: "e-ujian",
    label: "E-UJIAN",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "e-spmb",
    label: "E-SPMB",
    icon: <ClipboardList className="h-5 w-5" />,
  },
];

// Stat card data
const mainStats = [
  { label: "JUMLAH TUTOR", value: "12", color: "from-cyan-400 to-cyan-500" },
  { label: "JUMLAH WARGA BELAJAR", value: "350", color: "from-cyan-400 to-cyan-500" },
  { label: "JUMLAH ROMBEL", value: "9", color: "from-cyan-400 to-cyan-500" },
  { label: "JUMLAH PRODUK WB", value: "24", color: "from-cyan-400 to-cyan-500" },
  { label: "JUMLAH WB PAKET A", value: "85", color: "from-cyan-400 to-teal-500" },
  { label: "JUMLAH WB PAKET B", value: "120", color: "from-cyan-400 to-teal-500" },
  { label: "JUMLAH WB PAKET C", value: "145", color: "from-cyan-400 to-teal-500" },
  { label: "JUMLAH ALUMNI", value: "580", color: "from-cyan-400 to-teal-500" },
  { label: "JUMLAH PENGUNJUNG", value: "1.247", color: "from-cyan-500 to-sky-500" },
];

export default function DashboardPage({ user, handleLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [websiteExpanded, setWebsiteExpanded] = useState(false);

  const handleMenuClick = (id: string) => {
    if (id === "website") {
      setWebsiteExpanded(!websiteExpanded);
    } else {
      setActiveTab(id);
      setMobileSidebarOpen(false);
    }
  };

  // Render sidebar content (shared between desktop & mobile)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-5 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12 rounded-xl shadow-lg shadow-black/20 bg-white/10 p-0.5"
          />
          <div className="min-w-0">
            <span className="block text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">PKBM</span>
            <span className="block text-sm font-black tracking-tight text-white leading-tight">MENUJU MAKMUR</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group cursor-pointer ${
                activeTab === item.id
                  ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`transition-colors ${activeTab === item.id ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left tracking-wide">{item.label}</span>
              {item.children && (
                <span className="text-white/40">
                  {websiteExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              )}
            </button>

            {/* Sub-menu */}
            {item.children && websiteExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3 animate-in slide-in-from-top-2 duration-200">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setActiveTab(child.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === child.id
                        ? "bg-white/15 text-cyan-300"
                        : "text-white/50 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    <span className={activeTab === child.id ? "text-cyan-300" : "text-white/30"}>{child.icon}</span>
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  // Render the main dashboard content (stat cards)
  const renderDashboardContent = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {mainStats.map((stat, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-5 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.03] transition-all duration-300 cursor-default group`}
        >
          {/* Decorative circle */}
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-white/5" />

          <div className="relative z-10">
            <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-sm leading-none mb-2">
              {stat.value}
            </span>
            <span className="block text-[11px] font-bold text-white/90 uppercase tracking-wider leading-tight">
              {stat.label}
            </span>
          </div>
        </div>
      ))}

      {/* Info / Catatan Card */}
      <div className="col-span-2 sm:col-span-2 lg:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 p-6 shadow-md">
        <div className="absolute right-4 top-4 text-4xl opacity-30 select-none">📌</div>
        <div className="space-y-2">
          <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider">Catatan</h4>
          <p className="text-sm text-amber-700 font-semibold leading-relaxed">
            Data statistik di atas diambil secara otomatis dari database. Pastikan data selalu diperbarui
            untuk menjaga akurasi informasi dashboard.
          </p>
          <p className="text-xs text-amber-600/80 font-medium italic">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );

  // Right sidebar quick stats
  const renderRightSidebar = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* E-LEARNING Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-cyan-50 to-cyan-100/50 border-2 border-cyan-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            E-Learning
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
            <UserCheck className="h-5 w-5 text-cyan-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-cyan-700 leading-none mb-1">8</span>
            <span className="block text-[10px] font-bold text-cyan-600/80 uppercase tracking-wider">Tutor Aktif</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
            <Users className="h-5 w-5 text-cyan-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-cyan-700 leading-none mb-1">215</span>
            <span className="block text-[10px] font-bold text-cyan-600/80 uppercase tracking-wider">WB Aktif</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-cyan-600/60 italic text-center">Data diambil dari login E-Learning</p>
        </div>
      </div>

      {/* E-UJIAN Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/50 border-2 border-sky-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            E-Ujian
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
            <BookOpenCheck className="h-5 w-5 text-sky-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-sky-700 leading-none mb-1">3</span>
            <span className="block text-[10px] font-bold text-sky-600/80 uppercase tracking-wider">Nama Ujian</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
            <Eye className="h-5 w-5 text-sky-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-sky-700 leading-none mb-1">142</span>
            <span className="block text-[10px] font-bold text-sky-600/80 uppercase tracking-wider">WB Login</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-sky-600/60 italic text-center">Sediakan dulu sebelum diaktifkan</p>
        </div>
      </div>

      {/* E-SPMB Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/50 border-2 border-blue-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <ClipboardList className="h-4 w-4" />
            E-SPMB
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <UserPlus className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-blue-700 leading-none mb-1">47</span>
            <span className="block text-[10px] font-bold text-blue-600/80 uppercase tracking-wider">Jumlah Pendaftar</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <FileCheck className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-blue-700 leading-none mb-1">32</span>
            <span className="block text-[10px] font-bold text-blue-600/80 uppercase tracking-wider">Berkas Lengkap</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-blue-600/60 italic text-center">Sediakan dulu sebelum diaktifkan</p>
        </div>
      </div>
    </div>
  );

  // Render akademik / profil tabs content
  const renderActiveContent = () => {
    if (activeTab === "dashboard") {
      return renderDashboardContent();
    }
    if (activeTab === "akademik" || activeTab === "warga-belajar") {
      return (
        <div className="space-y-6">
          {user.role === "admin" && <AdminDashboard />}
          {user.role === "tutor" && <TutorDashboard />}
          {user.role === "siswa" && <SiswaDashboard />}
        </div>
      );
    }
    // Placeholder for other pages
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-300">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center shadow-lg shadow-cyan-200/50">
          <LayoutDashboard className="h-10 w-10 text-cyan-600" />
        </div>
        <h3 className="text-xl font-black text-slate-700 uppercase tracking-wide">
          {activeTab.replace(/-/g, " ").toUpperCase()}
        </h3>
        <p className="text-sm text-slate-500 font-semibold max-w-sm">
          Halaman ini sedang dalam pengembangan. Silakan kembali ke Dashboard untuk melihat statistik.
        </p>
        <Button
          onClick={() => setActiveTab("dashboard")}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold px-6 h-10 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
        >
          Kembali ke Dashboard
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cyan-100 flex font-sans animate-in fade-in duration-300">
      {/* ========== LEFT SIDEBAR (Desktop) ========== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-cyan-700 via-cyan-800 to-cyan-900 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* ========== MOBILE SIDEBAR OVERLAY ========== */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-cyan-700 via-cyan-800 to-cyan-900 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* ========== MAIN AREA (Header + Content + Right Sidebar) ========== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cyan-200/60 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Hamburger Toggle */}
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setSidebarOpen(!sidebarOpen);
                  } else {
                    setMobileSidebarOpen(true);
                  }
                }}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-700 to-cyan-800 text-white flex items-center justify-center hover:from-cyan-600 hover:to-cyan-700 active:scale-95 transition-all shadow-md shadow-cyan-700/20 cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Page Title */}
              <h1 className="text-xl sm:text-2xl font-black text-cyan-900 tracking-tight uppercase">
                {activeTab === "dashboard" ? "Dashboard" : activeTab.replace(/-/g, " ").toUpperCase()}
              </h1>
            </div>

            {/* Right: User Info + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-black text-cyan-900">{user.name}</span>
                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest leading-none mt-0.5">
                  {user.role}
                </span>
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold px-4 h-9 text-xs shadow-md shadow-red-500/20 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area with optional right sidebar */}
        <div className="flex-1 flex min-h-0">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {renderActiveContent()}
          </main>

          {/* Right Sidebar (only on dashboard tab, desktop) */}
          {activeTab === "dashboard" && (
            <aside className="hidden xl:block w-72 shrink-0 overflow-y-auto p-4 pr-5 border-l border-cyan-200/40">
              {renderRightSidebar()}
            </aside>
          )}
        </div>

        {/* Right Sidebar Mobile (below main content on smaller screens) */}
        {activeTab === "dashboard" && (
          <div className="xl:hidden p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Condensed mobile right sidebar panels */}
              {/* E-Learning */}
              <div className="rounded-2xl bg-gradient-to-b from-cyan-50 to-cyan-100/50 border-2 border-cyan-200/60 overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-2.5">
                  <h3 className="text-xs font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    E-Learning
                  </h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2.5 text-center border border-cyan-100">
                    <span className="block text-xl font-black text-cyan-700 leading-none mb-0.5">8</span>
                    <span className="block text-[9px] font-bold text-cyan-600/80 uppercase tracking-wider">Tutor Aktif</span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 text-center border border-cyan-100">
                    <span className="block text-xl font-black text-cyan-700 leading-none mb-0.5">215</span>
                    <span className="block text-[9px] font-bold text-cyan-600/80 uppercase tracking-wider">WB Aktif</span>
                  </div>
                </div>
              </div>

              {/* E-Ujian */}
              <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/50 border-2 border-sky-200/60 overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2.5">
                  <h3 className="text-xs font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    E-Ujian
                  </h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2.5 text-center border border-sky-100">
                    <span className="block text-xl font-black text-sky-700 leading-none mb-0.5">3</span>
                    <span className="block text-[9px] font-bold text-sky-600/80 uppercase tracking-wider">Nama Ujian</span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 text-center border border-sky-100">
                    <span className="block text-xl font-black text-sky-700 leading-none mb-0.5">142</span>
                    <span className="block text-[9px] font-bold text-sky-600/80 uppercase tracking-wider">WB Login</span>
                  </div>
                </div>
              </div>

              {/* E-SPMB */}
              <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/50 border-2 border-blue-200/60 overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5">
                  <h3 className="text-xs font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    E-SPMB
                  </h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                    <span className="block text-xl font-black text-blue-700 leading-none mb-0.5">47</span>
                    <span className="block text-[9px] font-bold text-blue-600/80 uppercase tracking-wider">Pendaftar</span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                    <span className="block text-xl font-black text-blue-700 leading-none mb-0.5">32</span>
                    <span className="block text-[9px] font-bold text-blue-600/80 uppercase tracking-wider">Berkas Lengkap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
