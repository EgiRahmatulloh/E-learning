import { useState, useEffect } from "react";
import { 
  Users, User, FileText, ChevronDown, Award, Building2,
  GraduationCap, LayoutDashboard, Megaphone,
  BookOpen, BookMarked, Layers,
  Globe,
  ClipboardList,
  ChevronRight,
  Type,
  CalendarDays,
  Newspaper,
  Download,
  ShoppingBag,
  Image,
} from "lucide-react";

export const TAB_LABELS: Record<string, string> = {
  dashboard: "DASHBOARD",
  "visi-misi": "VISI DAN MISI",
  "identitas-lembaga": "IDENTITAS LEMBAGA",
  "data-pengelola": "DATA PENGELOLA",
  "kelola-nilai": "KELOLA NILAI & KELAS",
  profil: "PROFIL SAYA",
  prestasi: "PRESTASI",
  "titik-layanan": "TITIK LAYANAN",
  "produk-wb": "PRODUK WARGA BELAJAR",
  alumni: "ALUMNI",
  "e-learning": "DASHBOARD E-LEARNING ADMIN",
  "elearning-dashboard": "DASHBOARD E-LEARNING",
  rombel: "ROMBEL",
};

export const getTabLabel = (id: string): string => {
  if (TAB_LABELS[id]) return TAB_LABELS[id];
  if (id.startsWith("mapel-")) {
    const part = id.replace("mapel-", "");
    // mapel-{slug}-nilai / mapel-{slug}-pendahuluan / mapel-{slug}-sesi-{n}
    const parts = part.split("-");
    if (parts[parts.length - 1] === "nilai") {
      return `NILAI – ${parts.slice(0, -1).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 1] === "partisipasi") {
      return `PARTISIPASI – ${parts.slice(0, -1).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 1] === "pendahuluan") {
      return `PENDAHULUAN – ${parts.slice(0, -1).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 1] === "sesi") {
      return `SESI – ${parts.slice(0, -1).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 1] === "tugas") {
      return `TUGAS – ${parts.slice(0, -1).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 2] === "laporan" && parts[parts.length - 1] === "nilai") {
      return `LAPORAN & NILAI – ${parts.slice(0, -2).join(" ").toUpperCase()}`;
    }
    if (parts[parts.length - 2] === "sesi") {
      const n = parts[parts.length - 1];
      return `SESI ${n} – ${parts.slice(0, -2).join(" ").toUpperCase()}`;
    }
    return part.replace(/-/g, " ").toUpperCase();
  }
  return id.replace(/-/g, " ").toUpperCase();
};

export const getSubjectsSiswa = (program?: string, kelas?: string): string[] => {
  const pA = [
    "Pendidikan Agama Islam dan Budi Pekerti", "Pendidikan Pancasila", "Bahasa Indonesia",
    "Matematika", "Ilmu Pengetahuan Alam dan Sosial", "PJOK", "Seni Budaya",
    "Bahasa Inggris", "Pemberdayaan", "Keterampilan",
  ];
  const pB = [
    "Pendidikan Agama Islam dan Budi Pekerti", "Pendidikan Pancasila", "Bahasa Indonesia",
    "Matematika", "Ilmu Pengetahuan Alam", "Ilmu Pengetahuan Sosial", "Bahasa Inggris",
    "PJOK", "Seni", "Pemberdayaan", "Keterampilan",
  ];
  const pC10 = [
    "Pendidikan Agama Islam dan Budi Pekerti", "Pendidikan Pancasila", "Bahasa Indonesia",
    "Matematika", "Ilmu Pengetahuan Alam", "Ilmu Pengetahuan Sosial", "Bahasa Inggris",
    "PJOK", "Seni", "Pemberdayaan", "Keterampilan",
  ];
  const pC1112 = [
    "Pendidikan Agama Islam dan Budi Pekerti", "Pendidikan Pancasila", "Bahasa Indonesia",
    "Matematika", "Bahasa Inggris", "PJOK", "Seni", "Sejarah", "Sosiologi",
    "Ekonomi", "Geografi", "Informatika", "Pemberdayaan", "Keterampilan",
  ];

  if (program === "Paket A") return pA;
  if (program === "Paket B") return pB;
  if (program?.toLowerCase().includes("paket c")) {
    if (kelas === "Kelas 10") return pC10;
    return pC1112;
  }
  // Fallback: tampilkan semua mapel Paket B
  return pB;
};

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

interface DashboardSidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

// ──────────────────────────────────────────────
// Komponen Sidebar
// ──────────────────────────────────────────────
export default function DashboardSidebar({
  user,
  activeTab,
  setActiveTab,
  setMobileSidebarOpen,
}: DashboardSidebarProps) {
  const userRole = user?.role;
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [tutorSetups, setTutorSetups] = useState<any[]>([]);
  const [siswaSetups, setSiswaSetups] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "tutor") {
      fetch(`/api/elearning/setups?tutorId=${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTutorSetups(data.data);
          }
        })
        .catch((err) => console.error("Failed to load tutor setups:", err));
    } else if (user?.role === "siswa" && user?.kelas) {
      fetch(`/api/elearning/setups?kelas=${encodeURIComponent(user.kelas)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSiswaSetups(data.data);
          }
        })
        .catch((err) => console.error("Failed to load siswa setups:", err));
    }
  }, [user?.id, user?.role, user?.kelas]);

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLeafClick = (id: string) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  };

  // ── Menentukan apakah suatu tab aktif berada di dalam pohon sebuah menu
  const dataPkbmTabs = ["identitas-lembaga", "data-pengelola", "visi-misi", "program-pendidikan", "sarana-fasilitas", "prestasi", "titik-layanan", "rombel", "tutor", "warga-belajar", "alumni"];

  const isAncestorActive = (id: string): boolean => {
    if (id === "data-pkbm") {
      return dataPkbmTabs.includes(activeTab);
    }
    if (id === "profil-group") {
      return dataPkbmTabs.includes(activeTab);
    }
    if (id === "e-learning") {
      return activeTab === "elearning-dashboard" ||
        activeTab.startsWith("mapel-");
    }
    if (id === "elearning-mata-pelajaran") {
      return activeTab.startsWith("mapel-");
    }
    // cek apakah tab aktif adalah salah satu sesi dari mapel ini
    const prefix = `mapel-${id.replace("mapel-parent-", "")}-`;
    return activeTab.startsWith(prefix);
  };

  // ─────────────────────────────────────────
  // RENDER: Sidebar untuk Siswa
  // ─────────────────────────────────────────
  if (userRole === "siswa") {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
              alt="PKBM Menuju Makmur"
              className="h-12 w-12 rounded-xl shadow-lg shadow-black/20 bg-white/10 p-0.5 object-contain"
            />
            <div className="min-w-0">
              <span className="block text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">PKBM</span>
              <span className="block text-sm font-black tracking-tight text-white leading-tight">MENUJU MAKMUR</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">

          {/* ── DASHBOARD E-LEARNING */}
          <button
            onClick={() => handleLeafClick("elearning-dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer group ${
              activeTab === "elearning-dashboard"
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={`transition-colors ${activeTab === "elearning-dashboard" ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left tracking-wide">DASHBOARD</span>
          </button>

          {/* ── E-LEARNING (collapsible) */}
          <div>
            <button
              onClick={() => toggleExpand("e-learning")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer group ${
                isAncestorActive("e-learning")
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`transition-colors ${isAncestorActive("e-learning") ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="flex-1 text-left tracking-wide">E-LEARNING</span>
              <span className="text-white/40">
                {expandedMenus["e-learning"] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </button>

            {expandedMenus["e-learning"] && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3 animate-in slide-in-from-top-2 duration-200">

                {/* Mata Pelajaran Saya (collapsible) */}
                <div>
                  <button
                    onClick={() => toggleExpand("elearning-mata-pelajaran")}
                    className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isAncestorActive("elearning-mata-pelajaran")
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-white/30"><BookMarked className="h-4 w-4" /></span>
                    <span className="flex-1 text-left uppercase">Mata Pelajaran Saya</span>
                    <span className="text-white/40">
                      {expandedMenus["elearning-mata-pelajaran"] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  {expandedMenus["elearning-mata-pelajaran"] && (
                    <div className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-3 animate-in slide-in-from-top-1 duration-200">
                      {siswaSetups.map((setup) => {
                        const subject = setup.mapel;
                        const slug = toSlug(subject);
                        const parentId = `mapel-setup-${setup.id}-${slug}`;
                        const isMapelActive = activeTab.startsWith(`mapel-setup-${setup.id}-`);

                        return (
                          <div key={setup.id}>
                            {/* Nama Mata Pelajaran (collapsible) */}
                            <button
                              onClick={() => toggleExpand(parentId)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                                isMapelActive
                                  ? "bg-white/10 text-white"
                                  : "text-white/50 hover:bg-white/10 hover:text-white/85"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                              <span className="flex-1 leading-tight">{subject}</span>
                              <span className="text-white/30 shrink-0">
                                {expandedMenus[parentId] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </span>
                            </button>

                            {/* Sub-menu: Partisipasi, Nilai, Pendahuluan, Sesi 1–8 */}
                            {expandedMenus[parentId] && (
                              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2 animate-in slide-in-from-top-1 duration-150">
                                {["partisipasi", "nilai", "pendahuluan", ...Array.from({ length: setup.jumlahSesi || 8 }, (_, i) => `sesi-${i + 1}`)].map((sub) => {
                                  const tabId = `mapel-setup-${setup.id}-${sub}`;
                                  const label = sub === "partisipasi" ? "Partisipasi"
                                    : sub === "nilai" ? "Nilai"
                                    : sub === "pendahuluan" ? "Pendahuluan"
                                    : `Sesi ${sub.replace("sesi-", "")}`;
                                  return (
                                    <button
                                      key={tabId}
                                      onClick={() => handleLeafClick(tabId)}
                                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold text-left transition-all cursor-pointer ${
                                        activeTab === tabId
                                          ? "bg-white/15 text-cyan-300"
                                          : "text-white/40 hover:bg-white/10 hover:text-white/80"
                                      }`}
                                    >
                                      <span className={`h-1 w-1 rounded-full shrink-0 ${activeTab === tabId ? "bg-cyan-300" : "bg-white/30"}`}></span>
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── E-UJIAN */}
          <button
            onClick={() => handleLeafClick("e-ujian")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer group ${
              activeTab === "e-ujian"
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={`transition-colors ${activeTab === "e-ujian" ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
              <FileText className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left tracking-wide">E-UJIAN</span>
          </button>

          {/* ── PROFIL SAYA */}
          <button
            onClick={() => handleLeafClick("profil")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer group ${
              activeTab === "profil"
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={`transition-colors ${activeTab === "profil" ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
              <User className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left tracking-wide">PROFIL SAYA</span>
          </button>

        </nav>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // RENDER: Sidebar untuk Admin / Tutor / Super Admin
  // ─────────────────────────────────────────
  const adminMenuItems = [
    { id: "dashboard", label: "DASHBOARD", icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      id: "website",
      label: "WEBSITE",
      icon: <Globe className="h-5 w-5" />,
      children:
        userRole === "super_admin"
          ? [
              { id: "header", label: "HEADER", icon: <Type className="h-4 w-4" /> },
              { id: "pengumuman", label: "PENGUMUMAN", icon: <Megaphone className="h-4 w-4" /> },
              { id: "agenda", label: "AGENDA", icon: <CalendarDays className="h-4 w-4" /> },
              { id: "berita", label: "BERITA", icon: <Newspaper className="h-4 w-4" /> },
              { id: "download", label: "DOWNLOAD", icon: <Download className="h-4 w-4" /> },
              { id: "produk-wb", label: "PRODUK WB", icon: <ShoppingBag className="h-4 w-4" /> },
              { id: "galeri", label: "GALERI", icon: <Image className="h-4 w-4" /> },
            ]
          : [
              { id: "pengumuman", label: "PENGUMUMAN", icon: <Megaphone className="h-4 w-4" /> },
              { id: "berita", label: "BERITA", icon: <Newspaper className="h-4 w-4" /> },
              { id: "agenda", label: "AGENDA", icon: <CalendarDays className="h-4 w-4" /> },
              { id: "galeri", label: "GALERI", icon: <Image className="h-4 w-4" /> },
            ],
    },
    ...(userRole === "super_admin" || userRole === "admin"
      ? [{
          id: "data-pkbm",
          label: "DATA PKBM",
          icon: <Building2 className="h-5 w-5" />,
          children: [
            {
              id: "profil-group", label: "PROFIL", icon: <User className="h-4 w-4" />,
              children: [
                ...(userRole === "super_admin" ? [
                  { id: "identitas-lembaga", label: "IDENTITAS LEMBAGA" },
                  { id: "data-pengelola", label: "DATA PENGELOLA" },
                  { id: "visi-misi", label: "VISI DAN MISI" },
                  { id: "program-pendidikan", label: "PROGRAM PENDIDIKAN" },
                  { id: "sarana-fasilitas", label: "SARANA DAN FASILITAS" },
                  { id: "prestasi", label: "PRESTASI" },
                  { id: "titik-layanan", label: "TITIK LAYANAN" },
                ] : []),
                { id: "rombel", label: "ROMBEL" },
              ],
            },
            ...(userRole === "super_admin" ? [
              { id: "tutor", label: "TUTOR", icon: <GraduationCap className="h-4 w-4" /> },
              { id: "warga-belajar", label: "WARGA BELAJAR", icon: <Users className="h-4 w-4" /> },
              { id: "alumni", label: "ALUMNI", icon: <Award className="h-4 w-4" /> },
            ] : []),
          ],
        }]
      : []),
    { 
      id: "e-learning", 
      label: "E-LEARNING", 
      icon: <BookOpen className="h-5 w-5" />,
      children: userRole === "tutor"
        ? Array.from(new Set(tutorSetups.map(s => s.kelas))).map((kelasName) => {
            const classSetups = tutorSetups.filter(s => s.kelas === kelasName);
            const kelasSlug = toSlug(kelasName);
            const displayKelasName = kelasName.includes(" - ") ? kelasName.split(" - ")[1].toUpperCase() : kelasName.toUpperCase();
            return {
              id: `elearning-kelas-${kelasSlug}`,
              label: displayKelasName,
              icon: <Layers className="h-4 w-4" />,
              children: classSetups.map(setup => {
                const mapelSlug = toSlug(setup.mapel);
                const setupId = setup.id;
                return {
                  id: `mapel-setup-${setupId}-${mapelSlug}`,
                  label: setup.mapel,
                  icon: <BookMarked className="h-4 w-4" />,
                  children: [
                    { id: `mapel-setup-${setupId}-pendahuluan`, label: "Pendahuluan" },
                    ...Array.from({ length: setup.jumlahSesi }, (_, i) => ({
                      id: `mapel-setup-${setupId}-sesi-${i + 1}`,
                      label: `Sesi ${i + 1}`
                    })),
                    { id: `mapel-setup-${setupId}-laporan-nilai`, label: "Laporan & Nilai" },
                  ]
                };
              })
            };
          })
        : undefined
    },
    { id: "e-ujian", label: "E-UJIAN", icon: <FileText className="h-5 w-5" /> },
    { id: "e-spmb", label: "E-SPMB", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "profil", label: "PROFIL SAYA", icon: <User className="h-5 w-5" /> },
  ];

  const handleAdminClick = (id: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpand(id);
    } else {
      handleLeafClick(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12 rounded-xl shadow-lg shadow-black/20 bg-white/10 p-0.5 object-contain"
          />
          <div className="min-w-0">
            <span className="block text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">PKBM</span>
            <span className="block text-sm font-black tracking-tight text-white leading-tight">MENUJU MAKMUR</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {adminMenuItems.map((item: any) => (
          <div key={item.id}>
            <button
              onClick={() => handleAdminClick(item.id, !!item.children)}
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
                  {expandedMenus[item.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              )}
            </button>

            {item.children && expandedMenus[item.id] && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3 animate-in slide-in-from-top-2 duration-200">
                {item.children.map((child: any) => {
                  if (child.children) {
                    return (
                      <div key={child.id} className="space-y-0.5">
                        <button
                          onClick={() => toggleExpand(child.id)}
                          className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-white/70 hover:bg-white/10 hover:text-white"
                        >
                          <span className="text-white/30">{child.icon}</span>
                          <span className="flex-1 text-left uppercase">{child.label}</span>
                          <span className="text-white/40">
                            {expandedMenus[child.id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                        {expandedMenus[child.id] && (
                          <div className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                            {child.children.map((sub: any) => {
                              if (sub.children) {
                                return (
                                  <div key={sub.id} className="space-y-0.5 mt-1">
                                    <button
                                      onClick={() => toggleExpand(sub.id)}
                                      className="w-full flex items-center gap-2.5 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-white/60 hover:bg-white/10 hover:text-white/90"
                                    >
                                      <span className="text-white/30">{sub.icon}</span>
                                      <span className="flex-1 text-left uppercase">{sub.label}</span>
                                      <span className="text-white/40">
                                        {expandedMenus[sub.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                      </span>
                                    </button>
                                    {expandedMenus[sub.id] && (
                                      <div className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                        {sub.children.map((leaf: any) => (
                                          <button
                                            key={leaf.id}
                                            onClick={() => handleLeafClick(leaf.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all cursor-pointer ${
                                              activeTab === leaf.id ? "bg-white/15 text-cyan-300" : "text-white/50 hover:bg-white/10 hover:text-white/85"
                                            }`}
                                          >
                                            <span className="h-1 w-1 rounded-full bg-cyan-300"></span>
                                            {leaf.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => handleLeafClick(sub.id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                                    activeTab === sub.id ? "bg-white/15 text-cyan-300" : "text-white/50 hover:bg-white/10 hover:text-white/85"
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
                                  {sub.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleLeafClick(child.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
                        activeTab === child.id ? "bg-white/15 text-cyan-300" : "text-white/70 hover:bg-white/10 hover:text-white/90"
                      }`}
                    >
                      <span className={activeTab === child.id ? "text-cyan-300" : "text-white/30"}>{child.icon}</span>
                      {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
