import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BookOpen
} from "lucide-react";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ElearningSiswa } from "./siswa/ElearningSiswa";
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
import WargaBelajarManager from "./admin/WargaBelajarManager";
import DownloadsManager from "./admin/DownloadsManager";
import ProductsManager from "./admin/ProductsManager";
import AlumniManager from "./admin/AlumniManager";
import GalleryManager from "./admin/GalleryManager";
import RombelManager from "./admin/RombelManager";
import ElearningAdminDashboard from "./admin/elearning/ElearningAdminDashboard";

// Dashboard Sub-components
import DashboardSidebar, { getTabLabel } from "./DashboardSidebar";
import WelcomeBanner from "./WelcomeBanner";
import RoleStatsGrid from "./RoleStatsGrid";

// Tutor Sub-components
import PendahuluanTab from "./tutor/elearning/PendahuluanTab";
import SesiKelasTab from "./tutor/elearning/SesiKelasTab";
import LaporanNilaiTab from "./tutor/elearning/LaporanNilaiTab";
import KehadiranTab from "./tutor/elearning/KehadiranTab";

interface DashboardPageProps {
  user: { id: number; name: string; username: string; role: string; email?: string; noHp?: string; alamat?: string; nik?: string; program?: string; kelas?: string };
  handleLogout: () => void;
  setUser: (user: any) => void;
}

export default function DashboardPage({ user, handleLogout, setUser }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState(user.role === "siswa" ? "elearning-dashboard" : "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Siswa Overhaul states
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [siswaSetups, setSiswaSetups] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "siswa" && user?.kelas) {
      fetch(`/api/elearning/setups?kelas=${encodeURIComponent(user.kelas)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSiswaSetups(data.data);
          }
        })
        .catch(err => console.error("Error fetching setups:", err));
    }
  }, [user]);

  const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  // Profile Form States
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || user.username || "",
    password: "",
    confirmPassword: "",
    noHp: user.noHp || "",
    alamat: user.alamat || "",
    nik: user.nik || "",
    nip: (user as any).nip || "",
    tempatTglLahir: (user as any).tempatTglLahir || "",
    jenisKelamin: (user as any).jenisKelamin || "",
    agama: (user as any).agama || "",
    pendidikan: (user as any).pendidikan || "",
    tanggalMulaiTugas: (user as any).tanggalMulaiTugas || "",
    nomorSkPengangkatan: (user as any).nomorSkPengangkatan || "",
    lembagaPengangkat: (user as any).lembagaPengangkat || "",
    nomorSkPenugasan: (user as any).nomorSkPenugasan || "",
    lembagaPenugas: (user as any).lembagaPenugas || "",
    nisn: (user as any).nisn || "",
    nis: (user as any).nis || "",
    namaAyah: (user as any).namaAyah || "",
    namaIbu: (user as any).namaIbu || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || user.username || "",
        password: "",
        confirmPassword: "",
        noHp: user.noHp || "",
        alamat: user.alamat || "",
        nik: user.nik || "",
        nip: (user as any).nip || "",
        tempatTglLahir: (user as any).tempatTglLahir || "",
        jenisKelamin: (user as any).jenisKelamin || "",
        agama: (user as any).agama || "",
        pendidikan: (user as any).pendidikan || "",
        tanggalMulaiTugas: (user as any).tanggalMulaiTugas || "",
        nomorSkPengangkatan: (user as any).nomorSkPengangkatan || "",
        lembagaPengangkat: (user as any).lembagaPengangkat || "",
        nomorSkPenugasan: (user as any).nomorSkPenugasan || "",
        lembagaPenugas: (user as any).lembagaPenugas || "",
        nisn: (user as any).nisn || "",
        nis: (user as any).nis || "",
        namaAyah: (user as any).namaAyah || "",
        namaIbu: (user as any).namaIbu || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setProfileMsg({ type: "error", text: "Konfirmasi password baru tidak cocok" });
      return;
    }

    setProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          noHp: formData.noHp || undefined,
          alamat: formData.alamat || undefined,
          nik: formData.nik || undefined,
          nip: formData.nip || undefined,
          tempatTglLahir: formData.tempatTglLahir || undefined,
          jenisKelamin: formData.jenisKelamin || undefined,
          agama: formData.agama || undefined,
          pendidikan: formData.pendidikan || undefined,
          tanggalMulaiTugas: formData.tanggalMulaiTugas || undefined,
          nomorSkPengangkatan: formData.nomorSkPengangkatan || undefined,
          lembagaPengangkat: formData.lembagaPengangkat || undefined,
          nomorSkPenugasan: formData.nomorSkPenugasan || undefined,
          lembagaPenugas: formData.lembagaPenugas || undefined,
          nisn: formData.nisn || undefined,
          nis: formData.nis || undefined,
          namaAyah: formData.namaAyah || undefined,
          namaIbu: formData.namaIbu || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui profil");

      if (data.success) {
        setProfileMsg({ type: "success", text: "Profil Anda berhasil diperbarui!" });
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setProfileMsg({ type: "error", text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

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
    if (activeTab === "kelola-nilai") {
      return (
        <div className="space-y-6">
          {user.role === "admin" && <AdminDashboard />}
        </div>
      );
    }
    if (activeTab === "elearning-dashboard" || activeTab === "e-learning" || activeTab.startsWith("mapel-")) {
      if (user.role === "siswa") {
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ElearningSiswa activeTab={activeTab} user={user} setActiveTab={setActiveTab} />
          </div>
        );
      }

      if (user.role === "admin" || user.role === "super_admin") {
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ElearningAdminDashboard />
          </div>
        );
      }

      if (user.role === "tutor") {
        if (activeTab.endsWith("-kehadiran")) {
          return <div className="space-y-6 animate-in fade-in duration-300"><KehadiranTab /></div>;
        }
        if (activeTab.endsWith("-pendahuluan")) {
          return <div className="space-y-6 animate-in fade-in duration-300"><PendahuluanTab activeTab={activeTab} user={user} /></div>;
        }
        if (activeTab.includes("-sesi-")) {
          return <div className="space-y-6 animate-in fade-in duration-300"><SesiKelasTab activeTab={activeTab} user={user} /></div>;
        }
        if (activeTab.endsWith("-laporan-nilai")) {
          return <div className="space-y-6 animate-in fade-in duration-300"><LaporanNilaiTab activeTab={activeTab} user={user} /></div>;
        }
      }
    }
    if (activeTab === "profil") {
      return (
        <div className="max-w-5xl animate-in fade-in duration-300">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-cyan-900">Profil Akun Saya</h3>
              <p className="text-xs text-slate-500 font-semibold">Ubah informasi identitas diri dan kata sandi akun Anda.</p>
            </div>

            {profileMsg && (
              <div className={`p-4 rounded-xl border font-bold text-sm ${profileMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
                }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Alamat Email</label>
                  <input
                    type="email"
                    name="username"
                    autoComplete="username"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                  />
                </div>

                {user.role === "siswa" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nomor HP</label>
                      <input
                        type="text"
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">NIS</label>
                      <input
                        type="text"
                        value={formData.nis}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">NISN</label>
                      <input
                        type="text"
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nama Ayah</label>
                      <input
                        type="text"
                        value={formData.namaAyah}
                        onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nama Ibu</label>
                      <input
                        type="text"
                        value={formData.namaIbu}
                        onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {user.role === "tutor" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">NIP</label>
                      <input
                        type="text"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Pendidikan Terakhir</label>
                      <input
                        type="text"
                        value={formData.pendidikan}
                        onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Tanggal Mulai Tugas</label>
                      <input
                        type="text"
                        value={formData.tanggalMulaiTugas}
                        onChange={(e) => setFormData({ ...formData, tanggalMulaiTugas: e.target.value })}
                        placeholder="DD/MM/YYYY"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {(user.role === "siswa" || user.role === "tutor") && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">NIK</label>
                      <input
                        type="text"
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Tempat, Tanggal Lahir</label>
                      <input
                        type="text"
                        value={formData.tempatTglLahir}
                        onChange={(e) => setFormData({ ...formData, tempatTglLahir: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Jenis Kelamin</label>
                      <select
                        value={formData.jenisKelamin}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      >
                        <option value="">Pilih</option>
                        <option value="L">Laki-Laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Agama</label>
                      <select
                        value={formData.agama}
                        onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                      >
                        <option value="">Pilih</option>
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all resize-none"
                  />
                </div>

                <div className="border-t border-slate-100 my-2 sm:col-span-2 lg:col-span-4" />

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Password Baru (Opsional)</label>
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="Kosongkan jika tidak diubah"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Kosongkan jika tidak diubah"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tampilkan detail statis lainnya */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Role Akun</span>
                  <span className="font-bold text-slate-700 uppercase">{user.role}</span>
                </div>
                {user.program && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Program</span>
                    <span className="font-bold text-slate-700">{user.program}</span>
                  </div>
                )}
                {user.kelas && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kelas</span>
                    <span className="font-bold text-slate-700">{user.kelas}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold text-sm px-6 py-2.5 cursor-pointer transition-colors"
                >
                  {profileLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    if (activeTab === "header") {
      if (user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen header.
          </div>
        );
      }
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <HeaderManager />
        </div>
      );
    }
    if (activeTab === "pengumuman") {
      if (user.role !== "admin" && user.role !== "tutor" && user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
    if (activeTab === "rombel") {
      if (user.role !== "admin" && user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka Rombel.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <RombelManager />
        </div>
      );
    }
    if (activeTab === "agenda") {
      if (user.role !== "admin" && user.role !== "tutor" && user.role !== "super_admin") {
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
      if (user.role !== "admin" && user.role !== "tutor" && user.role !== "super_admin") {
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
      if (user.role !== "super_admin") {
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
    if (activeTab === "warga-belajar") {
      if (user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka data Warga Belajar.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <WargaBelajarManager />
        </div>
      );
    }
    if (activeTab === "download") {
      if (user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen file download.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <DownloadsManager />
        </div>
      );
    }
    if (activeTab === "produk-wb") {
      if (user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen produk warga belajar.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <ProductsManager />
        </div>
      );
    }
    if (activeTab === "alumni") {
      if (user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen alumni.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <AlumniManager />
        </div>
      );
    }
    if (activeTab === "galeri") {
      if (user.role !== "admin" && user.role !== "tutor" && user.role !== "super_admin") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700 max-w-lg mx-auto mt-10">
            🔒 Akses Ditolak: Anda tidak memiliki wewenang untuk membuka manajemen galeri.
          </div>
        );
      }
      return (
        <div className="animate-in fade-in duration-300">
          <GalleryManager />
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
      {user.role !== "siswa" && (
        <aside
          className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-cyan-700 via-cyan-800 to-cyan-900 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"
            }`}
        >
          <DashboardSidebar
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />
        </aside>
      )}

      {/* ========== MOBILE SIDEBAR OVERLAY ========== */}
      {user.role !== "siswa" && mobileSidebarOpen && (
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
              user={user}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setMobileSidebarOpen={setMobileSidebarOpen}
            />
          </aside>
        </div>
      )}

      {/* ========== MAIN AREA (Header + Content) ========== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cyan-200/60 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3 relative">
              {/* Hamburger Toggle - Hidden for Siswa */}
              {user.role !== "siswa" && (
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
              )}

              {/* Page Title */}
              <h1
                className="text-xl sm:text-2xl font-black text-cyan-900 tracking-tight uppercase cursor-pointer"
                onClick={() => {
                  if (user.role === "siswa") setActiveTab("elearning-dashboard");
                }}
              >
                {user.role === "siswa" ? "ELEARNING" : "PKBM MENUJU MAKMUR"}
              </h1>
            </div>

            {/* Center: Dropdown Mapel (Siswa) */}
            <div className="flex flex-1 justify-center sm:justify-center px-2 sm:px-0">
              {user.role === "siswa" && siswaSetups.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                    onBlur={() => setTimeout(() => setSubjectDropdownOpen(false), 200)}
                    className="flex items-center gap-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold border border-cyan-200 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Mata Pelajaran</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </button>
                  {subjectDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-cyan-100 py-2 z-50">
                      {siswaSetups.map((setup) => {
                        const setupId = setup.id;
                        const mapelSlug = toSlug(setup.mapel);
                        return (
                          <button
                            key={setupId}
                            onClick={() => {
                              setActiveTab(`mapel-setup-${setupId}-${mapelSlug}-pendahuluan`);
                              setSubjectDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 transition-colors"
                          >
                            {setup.mapel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: User Info + Logout */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-3 relative"
              >
                {/* Avatar Info */}
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (user.role === "siswa") {
                      setAvatarDropdownOpen(!avatarDropdownOpen);
                    } else {
                      setActiveTab("profil");
                    }
                  }}
                  onBlur={() => {
                    if (user.role === "siswa") {
                      setTimeout(() => setAvatarDropdownOpen(false), 200);
                    }
                  }}
                >
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
                </div>

                {/* Avatar Dropdown for Siswa */}
                {user.role === "siswa" && avatarDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-cyan-100 py-2 z-50">
                    <button
                      onClick={() => {
                        setActiveTab("elearning-dashboard");
                        setAvatarDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("profil");
                        setAvatarDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 transition-colors"
                    >
                      Profil Saya
                    </button>
                    <div className="border-t border-cyan-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Keluar
                    </button>
                  </div>
                )}
              </div>

              {/* Logout Button (Hidden for Siswa as it's in dropdown) */}
              {user.role !== "siswa" && (
                <Button
                  onClick={handleLogout}
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold px-4 h-9 text-xs shadow-md shadow-red-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {renderActiveContent()}
          </main>
        </div>
      </div>
    </div>
  );
}