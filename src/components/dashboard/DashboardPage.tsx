import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { AdminDashboard } from "./admin/AdminDashboard";
import { TutorDashboard } from "./tutor/TutorDashboard";
import { SiswaDashboard } from "./siswa/SiswaDashboard";
import { HeaderManager } from "./admin/HeaderManager";
import AnnouncementManager from "./admin/AnnouncementManager";
import InstitutionProfileManager from "./admin/InstitutionProfileManager";
import ManagerManager from "./admin/ManagerManager";
import VisiMisiManager from "./admin/VisiMisiManager";
import EducationProgramManager from "./admin/EducationProgramManager";
import FacilitiesManager from "./admin/FacilitiesManager";
import { AchievementsManager } from "./admin/AchievementsManager";
import { ServicePointsManager } from "./admin/ServicePointsManager";
import AgendaManager from "./admin/AgendaManager";
import NewsManager from "./admin/NewsManager";
import TutorManager from "./admin/TutorManager";

// Dashboard Sub-components
import DashboardSidebar, { getTabLabel } from "./DashboardSidebar";
import DashboardRightSidebar from "./DashboardRightSidebar";
import WelcomeBanner from "./WelcomeBanner";
import RoleStatsGrid from "./RoleStatsGrid";

interface DashboardPageProps {
  user: { id: number; name: string; username: string; role: string; email?: string };
  handleLogout: () => void;
}

export default function DashboardPage({ user, handleLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Render akademik / profil / other tabs content
  const renderActiveContent = () => {
    if (activeTab === "dashboard") {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <WelcomeBanner userName={user.name} userRole={user.role} />
          <RoleStatsGrid userRole={user.role} />
        </div>
      );
    }
    if (activeTab === "warga-belajar" || activeTab === "kelola-nilai" || activeTab === "aktivitas-belajar") {
      return (
        <div className="space-y-6">
          {user.role === "admin" && <AdminDashboard />}
          {user.role === "tutor" && <TutorDashboard />}
          {user.role === "siswa" && <SiswaDashboard />}
        </div>
      );
    }
    if (activeTab === "profil") {
      return (
        <div className="max-w-2xl animate-in fade-in duration-300">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-cyan-900">Profil Akun Saya</h3>
              <p className="text-xs text-slate-500 font-semibold">Informasi kredensial dan identitas terdaftar Anda.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-medium text-slate-700">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nama Lengkap</span>
                <span className="text-base font-black text-slate-800">{user.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alamat Email</span>
                <span className="text-base font-semibold">{user.email || `${user.username}@pkbmmakmur.org`}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Username Akun</span>
                <span className="text-base font-semibold font-mono text-slate-600">{user.username}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Role / Otoritas Sesi</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700 uppercase tracking-widest mt-1">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === "header") {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <HeaderManager />
        </div>
      );
    }
    if (activeTab === "pengumuman") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen pengumuman.
          </div>
        );
      }
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <AnnouncementManager />
        </div>
      );
    }
    if (activeTab === "identitas-lembaga") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka identitas lembaga.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <InstitutionProfileManager />
        </div>
      );
    }
    if (activeTab === "data-pengelola") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka data pengelola.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <ManagerManager />
        </div>
      );
    }
    if (activeTab === "visi-misi") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Visi dan Misi.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <VisiMisiManager />
        </div>
      );
    }
    if (activeTab === "program-pendidikan") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Program Pendidikan.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <EducationProgramManager />
        </div>
      );
    }
    if (activeTab === "sarana-fasilitas") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Sarana dan Fasilitas.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <FacilitiesManager />
        </div>
      );
    }
    if (activeTab === "prestasi") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Prestasi.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <AchievementsManager />
        </div>
      );
    }
    if (activeTab === "titik-layanan") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Titik Layanan.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <ServicePointsManager />
        </div>
      );
    }
    if (activeTab === "agenda") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Agenda.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <AgendaManager />
        </div>
      );
    }
    if (activeTab === "berita") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Berita.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <NewsManager />
        </div>
      );
    }
    if (activeTab === "tutor") {
      if (user.role !== "admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka data Tutor.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <TutorManager />
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
          {getTabLabel(activeTab)}
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
    <div className="h-screen bg-cyan-100 flex font-sans overflow-hidden animate-in fade-in duration-300">
      {/* ========== LEFT SIDEBAR (Desktop) ========== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-cyan-700 via-cyan-800 to-cyan-900 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <DashboardSidebar
          userRole={user.role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
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
            <DashboardSidebar
              userRole={user.role}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setMobileSidebarOpen={setMobileSidebarOpen}
            />
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
                {getTabLabel(activeTab)}
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

            {/* Right Sidebar Mobile (below main content on smaller screens) */}
            {activeTab === "dashboard" && (
              <div className="xl:hidden mt-6">
                <DashboardRightSidebar />
              </div>
            )}
          </main>

          {/* Right Sidebar (only on dashboard tab, desktop) */}
          {activeTab === "dashboard" && (
            <aside className="hidden xl:block w-72 shrink-0 overflow-y-auto p-4 pr-5 border-l border-cyan-200/40">
              <DashboardRightSidebar />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}