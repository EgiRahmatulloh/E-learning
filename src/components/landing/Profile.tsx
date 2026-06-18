import { useState, useEffect } from "react";
import { 
  Info, Users, Target, BookOpen, Layers, Award, MapPin, 
  Phone, Mail, Shield, Landmark, UserCheck, Clock, Group, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstitutionProfile {
  namaLembaga: string;
  npsn: string;
  nomorIndukLembaga: string;
  statusAkreditasi: string;
  tahunBerdiri: string;
  nomorTelepon: string;
  email: string;
  alamatLengkap: string;
  noIzinPendirian: string;
  izinYayasan: string;
  izinOperasional: string;
  npwp: string;
  rekeningNomor: string;
  rekeningAtasNama: string;
  rekeningNamaBank: string;
  foto: string;
  gambar: string;
}

interface Manager {
  id: number;
  nama: string;
  jabatan: string;
  foto: string;
}

interface VisionMission {
  visi: string;
  misi: string;
}

interface EducationProgram {
  id: number;
  program: string;
  penjab: string;
  keterangan: string;
  foto: string;
}

interface Facility {
  id: number;
  nama: string;
  keterangan: string;
  foto: string;
}

interface Achievement {
  id: number;
  nama: string;
  tahun: string;
  tingkat: string;
  penyelenggara: string;
  peserta: string;
  keterangan: string;
  foto: string;
}

interface ServicePoint {
  id: number;
  nama: string;
  alamat: string;
  penjab: string;
  waktuPembelajaran: string;
  jumlahWb: string;
  keterangan: string;
  foto: string;
}

interface ProfileProps {
  isDetailed?: boolean;
  onNavigate?: (path: string) => void;
}

export default function Profile({ isDetailed = false, onNavigate }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<"identitas" | "pengelola" | "visi-misi" | "program" | "sarana" | "prestasi" | "layanan">("identitas");

  // State data
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [visionMission, setVisionMission] = useState<VisionMission | null>(null);
  const [programs, setPrograms] = useState<EducationProgram[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [showAllManagers, setShowAllManagers] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  useEffect(() => {
    if (!isDetailed) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
      } catch (err: any) {
        if (err.name === "AbortError") {
          return { success: false, aborted: true };
        }
        console.error(`Gagal memuat ${url}:`, err);
        return { success: false };
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          resProfile,
          resManagers,
          resVM,
          resPrograms,
          resFacilities,
          resAchievements,
          resServicePoints
        ] = await Promise.all([
          safeFetch("/api/institution-profile"),
          safeFetch("/api/public-managers"),
          safeFetch("/api/vision-mission"),
          safeFetch("/api/education-programs"),
          safeFetch("/api/facilities"),
          safeFetch("/api/achievements"),
          safeFetch("/api/service-points")
        ]);

        if (signal.aborted) return;

        if (resProfile?.success) setProfile(resProfile.data);
        if (resManagers?.success) setManagers(resManagers.data);
        if (resVM?.success) setVisionMission(resVM.data);
        if (resPrograms?.success) setPrograms(resPrograms.data);
        if (resFacilities?.success) setFacilities(resFacilities.data);
        if (resAchievements?.success) setAchievements(resAchievements.data);
        if (resServicePoints?.success) setServicePoints(resServicePoints.data);
      } catch (err) {
        console.error("Gagal mengambil data profil", err);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      controller.abort();
    };
  }, [isDetailed]);

  // If isDetailed is false, render original homepage profile overview:
  if (!isDetailed) {
    const handleReadMore = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onNavigate) {
        onNavigate("/profile");
      } else {
        window.history.pushState({}, "", "/profile");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <section id="profil" className="pt-8 pb-16 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Stats Grid */}
            <div className="grid grid-cols-2 gap-6 relative">
              <div className="p-6 rounded-2xl border border-slate-300 bg-white hover:border-[#ff6105] hover:-translate-y-1.5 transition-all flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#280f91] to-purple-600 text-white shadow-md">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">350+</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Warga Belajar</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-300 bg-white hover:border-[#ff6105] hover:-translate-y-1.5 transition-all flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6105] to-orange-400 text-white shadow-md">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">500+</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Lulusan Alumni</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-300 bg-white hover:border-[#ff6105] hover:-translate-y-1.5 transition-all flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-400 text-white shadow-md">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">18</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Tutor Kompeten</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-300 bg-white hover:border-[#ff6105] hover:-translate-y-1.5 transition-all flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-400 text-white shadow-md">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">12</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Rombel Kelas</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
                Mengenal Sekolah Kami
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight">
                Membina Potensi, Menciptakan <span className="text-[#ff6105]">Masa Depan</span>
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                Pusat Kegiatan Belajar Masyarakat (PKBM) Menuju Makmur hadir di Kabupaten Ciamis sebagai wadah pendidikan nonformal terakreditasi resmi. Kami menyelenggarakan pendidikan kesetaraan Paket A (Setara SD), Paket B (Setara SMP), dan Paket C (Setara SMA) untuk membina SDM berkualitas yang mandiri dan berdaya saing.
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Materi ajar fleksibel, mudah diikuti oleh pekerja/wirausaha.
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Didukung sarana komputer modern untuk Ujian Berbasis Komputer (UNBK).
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Dibimbing oleh tenaga pengajar dan tutor tersertifikasi resmi.
                </div>
              </div>
              <div className="pt-2 flex items-center gap-4">
                <Button
                  onClick={handleReadMore}
                  className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer"
                >
                  Lihat Selengkapnya
                </Button>
                <a href="#kontak">
                  <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-8 h-12 cursor-pointer">
                    Hubungi Kami
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: "identitas", label: "IDENTITAS", icon: <Info className="h-5 w-5" /> },
    { id: "pengelola", label: "PENGELOLA", icon: <Users className="h-5 w-5" /> },
    { id: "visi-misi", label: "VISI & MISI", icon: <Target className="h-5 w-5" /> },
    { id: "program", label: "PROGRAM", icon: <BookOpen className="h-5 w-5" /> },
    { id: "sarana", label: "SARANA", icon: <Layers className="h-5 w-5" /> },
    { id: "prestasi", label: "PRESTASI", icon: <Award className="h-5 w-5" /> },
    { id: "layanan", label: "LAYANAN", icon: <MapPin className="h-5 w-5" /> }
  ] as const;

  return (
    <section id="profil" className="py-16 bg-gradient-to-b from-[#f3f9fc] to-white relative overflow-hidden">
      
      {/* Background Decorative Blur circles */}
      <div className="absolute top-20 right-[-10%] w-96 h-96 bg-[#00badb]/10 blur-3xl rounded-full -z-10"></div>
      <div className="absolute bottom-20 left-[-10%] w-96 h-96 bg-[#9c27b0]/10 blur-3xl rounded-full -z-10"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-4 animate-in fade-in duration-700">
          <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block">
            INFORMASI PROFIL LEMBAGA
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight uppercase">
            Profil <span className="text-[#ff6105]">PKBM Menuju Makmur</span>
          </h2>
          <p className="text-slate-500 font-semibold text-sm leading-relaxed max-w-2xl mx-auto">
            Mengenal lebih dekat PKBM Menuju Makmur sebagai tempat belajar, berkembang, dan meraih masa depan yang lebih baik
          </p>
        </div>

        {/* TAB BAR NAVIGATION (Mockup-inspired Circle Tab Items) */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex bg-white/80 backdrop-blur-md p-2 rounded-full border border-slate-200 gap-2 min-w-max">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
                    active 
                      ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/35 scale-105" 
                      : "text-slate-650 hover:bg-slate-50 hover:text-[#280f91]"
                  }`}
                >
                  <span className={active ? "text-white" : "text-[#280f91]"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#280f91]/20 border-t-[#280f91] mb-4"></div>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Memuat Profil...</span>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            
            {/* 1. TAB CONTENT: IDENTITAS LEMBAGA */}
            {activeTab === "identitas" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-lg">
                
                {/* Left side details */}
                <div className="lg:col-span-7 space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                      Identitas Lembaga
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm font-semibold text-slate-700">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nama Lembaga</span>
                      <p className="text-slate-900 font-extrabold">{profile?.namaLembaga || "PKBM MENUJU MAKMUR"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">NPSN</span>
                      <p className="text-slate-900 font-extrabold">{profile?.npsn || "P9963025"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nomor Induk Lembaga</span>
                      <p className="text-slate-900 font-extrabold">{profile?.nomorIndukLembaga || "-"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status Akreditasi</span>
                      <p className="text-slate-900 font-extrabold">{profile?.statusAkreditasi || "-"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tahun Berdiri</span>
                      <p className="text-slate-900 font-extrabold">{profile?.tahunBerdiri || "-"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">NPWP</span>
                      <p className="text-slate-900 font-extrabold">{profile?.npwp || "-"}</p>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                      <p className="text-slate-900 font-extrabold leading-relaxed">{profile?.alamatLengkap || "-"}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Legalitas */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#ff6105] uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-4 w-4" /> Legalitas Lembaga
                      </h4>
                      <ul className="space-y-3 text-xs font-semibold text-slate-600">
                        <li>
                          <span className="block text-[10px] text-slate-400 uppercase font-black">No. Izin Pendirian Disdik</span>
                          <span className="text-slate-900 font-bold">{profile?.noIzinPendirian || "-"}</span>
                        </li>
                        <li>
                          <span className="block text-[10px] text-slate-400 uppercase font-black">Izin Pendirian Yayasan</span>
                          <span className="text-slate-900 font-bold">{profile?.izinYayasan || "-"}</span>
                        </li>
                        <li>
                          <span className="block text-[10px] text-slate-400 uppercase font-black">Izin Operasional Disdik</span>
                          <span className="text-slate-900 font-bold">{profile?.izinOperasional || "-"}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Kontak & Bank */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#ff6105] uppercase tracking-wider flex items-center gap-1.5">
                        <Landmark className="h-4 w-4" /> Rekening Bank & Kontak
                      </h4>
                      <ul className="space-y-3 text-xs font-semibold text-slate-600">
                        <li>
                          <span className="block text-[10px] text-slate-400 uppercase font-black">Rekening Bank</span>
                          <span className="text-slate-900 font-bold block">{profile?.rekeningNamaBank || "-"}</span>
                          <span className="text-slate-700 block mt-0.5">{profile?.rekeningNomor || "-"} a.n {profile?.rekeningAtasNama || "-"}</span>
                        </li>
                        <li className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-900 font-bold">{profile?.nomorTelepon || "-"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-900 font-bold break-all">{profile?.email || "-"}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right side Image / Photo */}
                <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
                  <div className="relative group w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 bg-[#f3f9fc]">
                    {profile?.foto ? (
                      <img 
                        src={profile.foto} 
                        alt="Logo PKBM"
                        className="w-full aspect-[4/3] object-contain p-6 bg-white"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] flex items-center justify-center text-slate-350 bg-white">
                        <Landmark className="h-20 w-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <span className="text-white text-xs font-black uppercase tracking-wider">PKBM MENUJU MAKMUR</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. TAB CONTENT: DATA PENGELOLA */}
            {activeTab === "pengelola" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-lg space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Data Pengelola
                  </h3>
                </div>

                {managers.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {(showAllManagers ? managers : managers.slice(0, 8)).map((m) => (
                        <div 
                          key={m.id} 
                          className="p-6 rounded-2xl border border-slate-50 bg-slate-50/40 hover:bg-white hover:border-[#280f91]/15 hover:shadow-xl hover:-translate-y-1.5 transition-all text-center flex flex-col items-center gap-4 group"
                        >
                          <div className="h-24 w-24 rounded-full overflow-hidden shadow-md border-4 border-white bg-slate-200 flex items-center justify-center">
                            {m.foto ? (
                              <img 
                                src={m.foto} 
                                alt={m.nama}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <Users className="h-10 w-10 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1 text-center min-w-0 w-full">
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-[#280f91] transition-colors truncate">
                              {m.nama}
                            </h4>
                            <span className="inline-block text-[9px] font-black text-white bg-[#9c27b0] rounded-full px-3 py-1 uppercase tracking-wider truncate max-w-full">
                              {m.jabatan}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {managers.length > 8 && !showAllManagers && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowAllManagers(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase">
                    Tidak ada data pengelola saat ini
                  </div>
                )}
              </div>
            )}

            {/* 3. TAB CONTENT: VISI & MISI */}
            {activeTab === "visi-misi" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-lg space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Visi & Misi
                  </h3>
                </div>

                <div className="space-y-8">
                  {/* Visi */}
                  <div className="space-y-4 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-lg font-black text-[#280f91] uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-5 w-5" /> VISI
                    </h4>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed text-justify">
                      {visionMission?.visi || "TERWUJUDNYA MASYARAKAT YANG BERAKHLAK MULIA, CERDAS, KREATIF, INOVATIF, TERAMPIL, MANDIRI, DAN BERDAYA SAING"}
                    </p>
                  </div>

                  {/* Misi */}
                  <div className="space-y-4 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-lg font-black text-[#280f91] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-5 w-5" /> MISI
                    </h4>
                    {visionMission?.misi ? (
                      <ol className="list-decimal pl-5 space-y-2.5 text-sm font-semibold text-slate-700 leading-relaxed">
                        {visionMission.misi.split("\n").filter(Boolean).map((line, idx) => {
                          const cleanLine = line.replace(/^\d+[\.\-\s]*/, "");
                          return <li key={idx}>{cleanLine}</li>;
                        })}
                      </ol>
                    ) : (
                      <ol className="list-decimal pl-5 space-y-2.5 text-sm font-semibold text-slate-700 leading-relaxed">
                        <li>MEWULJUDKAN PROGRAM PENDIDIKAN LUAR SEKOLAH YANG BERBASIS PADA MASYARAKAT DAN BERORIENTASI PADA KECAKAPAN HIDUP (LIFE SKILLS);</li>
                        <li>MEMPERLUAS AKSES DAN PEMERATAAN PENINGKATAN PENDIDIKAN;</li>
                        <li>MELAKSANAKAN PROGRAM PENDIDIKAN KEWIRAUSAHAAN DEMI TERWUJUDNYA MASYARAKAT MANDIRI;</li>
                        <li>MELAKSANAKAN KERJA SAMA DENGAN STAKE HOLDER DEMI TERWUJUDNYA PROGRAM.</li>
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. TAB CONTENT: PROGRAM PENDIDIKAN */}
            {activeTab === "program" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-2xl space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Program Pendidikan
                  </h3>
                </div>

                {programs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {programs.map((p) => (
                      <div 
                        key={p.id} 
                        className="rounded-3xl border border-slate-100 bg-[#f8fdff] shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col group"
                      >
                        {/* Image Frame */}
                        <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                          {p.foto ? (
                            <img 
                              src={p.foto} 
                              alt={p.program}
                              className="h-full w-full object-cover group-hover:scale-105 transition-all"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-350 bg-cyan-50">
                              <BookOpen className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="bg-[#280f91] text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                              {p.program}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 flex-1 flex flex-col gap-3 text-left">
                          <h4 className="text-base font-black text-slate-900 group-hover:text-[#280f91] transition-all">
                            {p.program}
                          </h4>
                          
                          {p.penjab && (
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-[#00badb]" />
                              <span>Koordinator: {p.penjab}</span>
                            </div>
                          )}

                          <p className="text-xs font-semibold text-slate-600 leading-relaxed flex-1 mt-1 text-justify">
                            {p.keterangan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase">
                    Tidak ada program pendidikan terdaftar saat ini
                  </div>
                )}
              </div>
            )}

            {/* 5. TAB CONTENT: SARANA & FASILITAS */}
            {activeTab === "sarana" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-2xl space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Sarana & Fasilitas
                  </h3>
                </div>

                {facilities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {facilities.map((item) => (
                      <div 
                        key={item.id} 
                        className="rounded-3xl border border-slate-100 bg-[#fbfbfb] shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col group"
                      >
                        {/* Image Frame */}
                        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                          {item.foto ? (
                            <img 
                              src={item.foto} 
                              alt={item.nama}
                              className="h-full w-full object-cover group-hover:scale-105 transition-all"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-350 bg-slate-100">
                              <Layers className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-5 text-left space-y-2">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-[#280f91] transition-all">
                            {item.nama}
                          </h4>
                          <p className="text-xs font-semibold text-slate-550 leading-relaxed text-justify line-clamp-4">
                            {item.keterangan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase">
                    Tidak ada sarana & fasilitas terdaftar saat ini
                  </div>
                )}
              </div>
            )}

            {/* 6. TAB CONTENT: PRESTASI */}
            {activeTab === "prestasi" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-lg space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Daftar Prestasi
                  </h3>
                </div>

                {achievements.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                      {(showAllAchievements ? achievements : achievements.slice(0, 6)).map((item) => (
                        <div 
                          key={item.id} 
                          className="rounded-3xl border border-slate-100 bg-[#fdfaf7] shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col group"
                        >
                          {/* Image Frame */}
                          <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                            {item.foto ? (
                              <img 
                                src={item.foto} 
                                alt={item.nama}
                                className="h-full w-full object-cover group-hover:scale-105 transition-all"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-350 bg-slate-100">
                                <Award className="h-10 w-10" />
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className="bg-[#9c27b0] text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                                Tahun {item.tahun}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-5 text-left space-y-2 flex-1 flex flex-col min-w-0">
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-[#280f91] transition-all line-clamp-2">
                              {item.nama}
                            </h4>
                            
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide space-y-0.5 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[#ff6105]">Tingkat:</span>
                                <span className="text-slate-800 font-black">{item.tingkat}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[#ff6105]">Penyelenggara:</span>
                                <span className="text-slate-800 font-bold truncate max-w-full">{item.penyelenggara}</span>
                              </div>
                            </div>

                            <p className="text-xs font-semibold text-slate-550 leading-relaxed text-justify line-clamp-3 mt-1.5 flex-1">
                              {item.keterangan}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {achievements.length > 6 && !showAllAchievements && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowAllAchievements(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase">
                    Tidak ada data prestasi saat ini
                  </div>
                )}
              </div>
            )}

            {/* 7. TAB CONTENT: TITIK LAYANAN */}
            {activeTab === "layanan" && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-2xl space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#280f91] border-b-4 border-[#00badb] pb-2 inline-block uppercase tracking-wide">
                    Titik Layanan Pembelajaran
                  </h3>
                </div>

                {servicePoints.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {servicePoints.map((item) => (
                      <div 
                        key={item.id} 
                        className="rounded-3xl border border-slate-100 bg-[#f7fdfb] shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col group"
                      >
                        {/* Image Frame */}
                        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                          {item.foto ? (
                            <img 
                              src={item.foto} 
                              alt={item.nama}
                              className="h-full w-full object-cover group-hover:scale-105 transition-all"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-350 bg-slate-100">
                              <MapPin className="h-10 w-10" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="bg-[#00badb] text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {item.waktuPembelajaran || "Jadwal Fleksibel"}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-5 text-left space-y-2.5 flex-1 flex flex-col">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-[#280f91] transition-all">
                            {item.nama}
                          </h4>
                          
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide space-y-1 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-800 font-bold truncate max-w-full">{item.alamat}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-[#ff6105] shrink-0" />
                              <span className="text-slate-800 font-black">Penjab: {item.penjab}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Group className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="text-slate-800 font-black">Jumlah: {item.jumlahWb}</span>
                            </div>
                          </div>

                          <p className="text-xs font-semibold text-slate-550 leading-relaxed text-justify line-clamp-3 mt-1 flex-1">
                            {item.keterangan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase">
                    Tidak ada data titik layanan terdaftar saat ini
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
