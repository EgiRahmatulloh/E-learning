import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  PlayCircle,
  BookOpen,
  SortAsc,
  ChevronLeft,
} from "lucide-react";
import { getSubjectsSiswa } from "../DashboardSidebar";
import { MapelPartisipasi } from "./elearning/MapelPartisipasi";
import { MapelNilai } from "./elearning/MapelNilai";
import { MapelPendahuluan } from "./elearning/MapelPendahuluan";
import { MapelSesi } from "./elearning/MapelSesi";

interface ElearningSiswaProps {
  activeTab: string;
  user: { program?: string; kelas?: string; [key: string]: unknown };
  setActiveTab?: (tab: string) => void;
}

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// Data statis dummy per subjek (seed index biar konsisten)
const getSubjectMeta = (index: number) => {
  const colorGradients = [
    "from-cyan-500 to-cyan-700",
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-700",
    "from-amber-500 to-orange-600",
  ];
  const tutors = [
    "Bapak Ahmad Fauzi, S.Pd",
    "Ibu Siti Rahayu, M.Pd",
    "Bapak Dedi Kurniawan, S.Pd",
    "Ibu Rina Agustina, M.Pd",
    "Bapak Hendra Wijaya, S.Pd",
    "Ibu Dewi Sartika, S.Pd",
    "Bapak Rudi Hartono, M.Pd",
    "Ibu Sri Wahyuni, S.Pd",
  ];
  const progresses = [100, 75, 45, 30, 0, 60, 85, 20];

  return {
    gradient: colorGradients[index % colorGradients.length],
    tutor: tutors[index % tutors.length],
    progress: progresses[index % progresses.length],
  };
};

export function ElearningSiswa({ activeTab, user, setActiveTab }: ElearningSiswaProps) {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [filter, setFilter] = useState<"semua" | "progres" | "selesai">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nama" | "terakhir_diakses">("nama");
  const [hiddenSubjects, setHiddenSubjects] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Cek apakah tab yang aktif adalah halaman detail sesi/nilai/pendahuluan
  const isMapelDetail = activeTab.startsWith("mapel-");

  // Semua mapel sesuai program/kelas
  const allSubjects = useMemo(() => {
    return getSubjectsSiswa(user?.program, user?.kelas).map((name, index) => {
      const meta = getSubjectMeta(index);
      const slug = toSlug(name);
      let status: "belum" | "progres" | "selesai" = "belum";
      if (meta.progress > 0 && meta.progress < 100) status = "progres";
      if (meta.progress === 100) status = "selesai";
      return {
        id: slug,
        name,
        slug,
        tutor: meta.tutor,
        progress: meta.progress,
        status,
        gradient: meta.gradient,
      };
    });
  }, [user]);

  const filteredSubjects = useMemo(() => {
    let result = allSubjects.filter((s) => !hiddenSubjects.has(s.id));

    if (filter === "progres") result = result.filter((s) => s.status === "progres");
    if (filter === "selesai") result = result.filter((s) => s.status === "selesai");

    if (searchQuery) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "nama") return a.name.localeCompare(b.name);
      return b.progress - a.progress; // "terakhir diakses" pakai progress sebagai proxy
    });

    return result;
  }, [allSubjects, hiddenSubjects, filter, searchQuery, sortBy]);

  // ──── Halaman Detail (Nilai / Pendahuluan / Sesi)
  if (isMapelDetail) {
    // Contoh: mapel-matematika-sesi-3 → slug=matematika, sub=sesi-3
    const withoutPrefix = activeTab.replace("mapel-", "");
    // Cari slug subjek yang cocok
    const matchedSubject = allSubjects.find((s) => withoutPrefix.startsWith(s.slug + "-"));
    const subPart = matchedSubject
      ? withoutPrefix.replace(matchedSubject.slug + "-", "")
      : withoutPrefix;

    const subLabel =
      subPart === "partisipasi" ? "Partisipasi"
      : subPart === "nilai" ? "Nilai"
      : subPart === "pendahuluan" ? "Pendahuluan"
      : subPart.startsWith("sesi-") ? `Sesi ${subPart.replace("sesi-", "")}`
      : subPart;

    const mapelContent = useMemo(() => {
      const subjectName = matchedSubject?.name || "Mata Pelajaran";
      const tutorName = matchedSubject?.tutor || "Tutor";
      
      if (subPart === "partisipasi") return <MapelPartisipasi subjectName={subjectName} tutorName={tutorName} />;
      if (subPart === "nilai") return <MapelNilai subjectName={subjectName} />;
      if (subPart === "pendahuluan") return <MapelPendahuluan subjectName={subjectName} />;
      if (subPart.startsWith("sesi-")) {
        const sessionNumber = parseInt(subPart.replace("sesi-", ""), 10);
        return <MapelSesi subjectName={subjectName} sessionNumber={sessionNumber} />;
      }
      return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center space-y-4">
          <BookOpen className="h-14 w-14 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-700">Konten sedang disiapkan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Halaman <span className="font-bold text-[#280f91]">{subLabel}</span> untuk mata pelajaran{" "}
            <span className="font-bold text-[#280f91]">{matchedSubject?.name || "terpilih"}</span> sedang dalam pengembangan.
          </p>
        </div>
      );
    }, [subPart, matchedSubject, subLabel]);

    const menus = [
      { id: "partisipasi", label: "Partisipasi" },
      { id: "nilai", label: "Nilai" },
      { id: "pendahuluan", label: "Pendahuluan" },
      { id: "sesi-1", label: "Sesi 1" },
      { id: "sesi-2", label: "Sesi 2" },
      { id: "sesi-3", label: "Sesi 3" },
      { id: "sesi-4", label: "Sesi 4" },
      { id: "sesi-5", label: "Sesi 5" },
      { id: "sesi-6", label: "Sesi 6" },
      { id: "sesi-7", label: "Sesi 7" },
      { id: "sesi-8", label: "Sesi 8" },
    ];
    const currentIndex = menus.findIndex((m) => m.id === subPart);
    const prevMenu = currentIndex > 0 ? menus[currentIndex - 1] : null;
    const nextMenu = currentIndex >= 0 && currentIndex < menus.length - 1 ? menus[currentIndex + 1] : null;

    const handleNavigate = (menuId: string) => {
      if (setActiveTab && matchedSubject) {
        setActiveTab(`mapel-${matchedSubject.slug}-${menuId}`);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header card */}
        <div className={`rounded-3xl bg-gradient-to-br ${matchedSubject?.gradient ?? "from-cyan-500 to-cyan-700"} p-8 text-white shadow-lg relative`}>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab("elearning-dashboard")}
              className="absolute top-6 right-6 h-10 px-4 rounded-xl bg-white/20 hover:bg-white/30 transition-all font-bold text-sm flex items-center gap-2 backdrop-blur-sm cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </button>
          )}
          <p className="text-sm font-bold text-white/70 mb-1 uppercase tracking-widest mt-2 sm:mt-0">
            {matchedSubject?.name}
          </p>
          <h1 className="text-3xl font-black">{subLabel}</h1>
          <p className="text-sm text-white/70 mt-2">{matchedSubject?.tutor}</p>
        </div>

        {/* Dinamis konten */}
        {mapelContent}

        {/* Navigasi Bawah */}
        <div className="flex items-center justify-between mt-8 pt-4">
          {prevMenu ? (
            <Button
              onClick={() => handleNavigate(prevMenu.id)}
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold px-6 h-12"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {prevMenu.label}
            </Button>
          ) : <div />}

          {nextMenu ? (
            <Button
              onClick={() => handleNavigate(nextMenu.id)}
              className="rounded-xl bg-[#280f91] hover:bg-[#3a1bca] text-white font-bold px-6 h-12 shadow-md shadow-[#280f91]/20"
            >
              {nextMenu.label}
              <ChevronLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          ) : <div />}
        </div>
      </div>
    );
  }

  // ──── Halaman Dashboard E-Learning (daftar mapel)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(["semua", "progres", "selesai"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? "bg-white text-[#280f91] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "semua" ? "Semua" : f === "progres" ? "Dalam Progres" : "Selesai"}
              </button>
            ))}
          </div>

          {/* Search + Sort + View */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#280f91]/20 focus:border-[#280f91]"
              />
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortBy((p) => (p === "nama" ? "terakhir_diakses" : "nama"))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all hidden sm:flex"
            >
              <SortAsc className="h-3.5 w-3.5" />
              {sortBy === "nama" ? "Nama" : "Terakhir Diakses"}
            </button>

            {/* View toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-white text-[#280f91] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                title="Tampilan Card"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-[#280f91] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                title="Tampilan List"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subject List */}
      {filteredSubjects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Tidak ada mata pelajaran yang ditemukan.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "card"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              : "space-y-4"
          }
        >
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
              }`}
            >
              {/* Cover */}
              <div
                className={`relative bg-gradient-to-br ${subject.gradient} flex items-center justify-center ${
                  viewMode === "card" ? "h-36 w-full" : "h-28 sm:h-auto sm:w-40 w-full shrink-0"
                }`}
              >
                <BookOpen className="h-12 w-12 text-white/30" />
                {subject.status === "selesai" && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    ✓ SELESAI
                  </div>
                )}

                {/* 3-dot menu — kiri atas */}
                <div className="absolute top-2 left-2">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === subject.id ? null : subject.id)}
                    className="h-7 w-7 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {openMenuId === subject.id && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in duration-150">
                      <button
                        onClick={() => { setOpenMenuId(null); setActiveTab?.(`mapel-${subject.slug}-pendahuluan`); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <PlayCircle className="h-3.5 w-3.5 inline mr-2 text-[#280f91]" />
                        Mulai Materi ini
                      </button>
                      <button
                        onClick={() => {
                          setHiddenSubjects((prev) => new Set([...prev, subject.id]));
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Hapus dari tampilan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={`p-4 flex-1 flex flex-col gap-3 ${viewMode === "list" ? "justify-between sm:flex-row sm:items-center" : ""}`}>
                <div className={viewMode === "list" ? "flex-1 min-w-0" : ""}>
                  <h3 className="font-black text-slate-800 text-sm leading-tight line-clamp-2">
                    {subject.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{subject.tutor}</p>
                </div>

                <div className={`space-y-2 ${viewMode === "list" ? "sm:w-64 shrink-0" : ""}`}>
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Progress</span>
                      <span className={subject.progress === 100 ? "text-emerald-600" : "text-[#280f91]"}>
                        {subject.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${
                          subject.progress === 100 ? "bg-emerald-500" : "bg-[#280f91]"
                        }`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => setActiveTab?.(`mapel-${subject.slug}-pendahuluan`)}
                    className={`rounded-xl font-bold bg-[#ff6105] hover:bg-[#e05404] text-white text-xs shadow-md shadow-orange-400/20 transition-all cursor-pointer ${
                      viewMode === "card" ? "w-full" : ""
                    }`}
                    size="sm"
                  >
                    <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                    Masuk Materi ini
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
