import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, Layers } from "lucide-react";
import { AdminDashboard } from "./admin/AdminDashboard";
import { TutorDashboard } from "./tutor/TutorDashboard";
import { SiswaDashboard } from "./siswa/SiswaDashboard";

interface DashboardPageProps {
  user: { id: number; name: string; username: string; role: string; email?: string };
  handleLogout: () => void;
}

export default function DashboardPage({ user, handleLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState("beranda");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-in fade-in duration-300">
      {/* Dashboard Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
              alt="PKBM Menuju Makmur"
              className="h-10 w-10"
            />
            <div>
              <span className="block text-[10px] font-black tracking-widest text-[#ff6105] uppercase leading-none">Portal Internal</span>
              <span className="text-base font-black tracking-tight text-[#280f91]">PKBM MENUJU MAKMUR</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black text-[#280f91]">{user.name}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">{user.role}</span>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 h-9 cursor-pointer transition-colors"
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <Button 
            onClick={() => setActiveTab("beranda")}
            variant={activeTab === "beranda" ? "default" : "ghost"}
            className={`w-full justify-start rounded-xl font-bold h-11 px-4 cursor-pointer transition-all ${
              activeTab === "beranda" 
                ? "bg-[#280f91] text-white hover:bg-[#280f91] shadow-md shadow-[#280f91]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="h-5 w-5 mr-3" />
            Beranda Dasbor
          </Button>

          <Button 
            onClick={() => setActiveTab("akademik")}
            variant={activeTab === "akademik" ? "default" : "ghost"}
            className={`w-full justify-start rounded-xl font-bold h-11 px-4 cursor-pointer transition-all ${
              activeTab === "akademik" 
                ? "bg-[#280f91] text-white hover:bg-[#280f91] shadow-md shadow-[#280f91]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            {user.role === 'admin' && 'Kelola Warga Belajar'}
            {user.role === 'tutor' && 'Kelola Nilai & Kelas'}
            {user.role === 'siswa' && 'Aktivitas Belajar Saya'}
          </Button>

          <Button 
            onClick={() => setActiveTab("profil")}
            variant={activeTab === "profil" ? "default" : "ghost"}
            className={`w-full justify-start rounded-xl font-bold h-11 px-4 cursor-pointer transition-all ${
              activeTab === "profil" 
                ? "bg-[#280f91] text-white hover:bg-[#280f91] shadow-md shadow-[#280f91]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            Informasi Profil
          </Button>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {activeTab === "beranda" && (
            <div className="space-y-6">
              {/* Welcome Glowing Header */}
              <Card className="border-[#280f91]/10 bg-gradient-to-r from-[#280f91]/5 via-blue-50 to-[#ff6105]/5 p-6 sm:p-8 rounded-2xl overflow-hidden relative shadow-sm">
                <div className="absolute right-0 top-0 w-48 h-48 bg-[#ff6105]/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                <div className="relative z-10 space-y-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-[#280f91] px-3 py-1 text-xs font-black uppercase tracking-wider">
                    Sesi Aktif
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#280f91] leading-tight">
                    Selamat datang di Portal Kelas, {user.name}!
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed max-w-2xl">
                    {user.role === 'admin' && 'Anda terhubung sebagai Administrator. Gunakan menu sebelah kiri untuk mengawasi seluruh aktivitas kesetaraan.'}
                    {user.role === 'tutor' && 'Anda terhubung sebagai Tutor Pendidik. Kelola proses mengajar, unggah materi kelas digital, dan berikan evaluasi.'}
                    {user.role === 'siswa' && 'Tetap semangat mengejar masa depan gemilang! Semua aktivitas belajar, rapor, dan kuis Anda dapat diakses secara real-time.'}
                  </p>
                </div>
              </Card>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-slate-100 p-6 rounded-2xl shadow-xs bg-white">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {user.role === 'admin' && 'Jumlah Warga Belajar'}
                    {user.role === 'tutor' && 'Kelas Pengajaran'}
                    {user.role === 'siswa' && 'Mata Pelajaran'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#280f91]">
                      {user.role === 'admin' && '350+'}
                      {user.role === 'tutor' && '3 Kelas'}
                      {user.role === 'siswa' && '5 Matpel'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Aktif</span>
                  </div>
                </Card>

                <Card className="border-slate-100 p-6 rounded-2xl shadow-xs bg-white">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {user.role === 'admin' && 'Tutor Pendidik'}
                    {user.role === 'tutor' && 'Tugas Masuk'}
                    {user.role === 'siswa' && 'Tugas Aktif'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#280f91]">
                      {user.role === 'admin' && '12 Orang'}
                      {user.role === 'tutor' && '45 Tugas'}
                      {user.role === 'siswa' && '2 Tugas'}
                    </span>
                    <span className="text-xs font-bold text-amber-600">Perlu Review</span>
                  </div>
                </Card>

                <Card className="border-slate-100 p-6 rounded-2xl shadow-xs bg-white">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {user.role === 'admin' && 'Persentase Kelulusan'}
                    {user.role === 'tutor' && 'Rata-rata Presensi'}
                    {user.role === 'siswa' && 'Indeks Prestasi'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#280f91]">
                      {user.role === 'admin' && '98.5%'}
                      {user.role === 'tutor' && '92%'}
                      {user.role === 'siswa' && '88.5'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Sangat Baik</span>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "akademik" && (
            <div className="space-y-6">
              {user.role === "admin" && <AdminDashboard />}
              {user.role === "tutor" && <TutorDashboard />}
              {user.role === "siswa" && <SiswaDashboard />}
            </div>
          )}

          {activeTab === "profil" && (
            <Card className="border-slate-200/60 bg-white p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-[#280f91]">Profil Akun Saya</h3>
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
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
