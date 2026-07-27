import { useState, useEffect, useMemo } from "react";
import { Users, Activity, FileQuestion, Layers, ArrowLeft, BookOpen, Search, X } from "lucide-react";
import KelolaElearning from "./KelolaElearning";
import TutorMonitoring from "./TutorMonitoring";
import SiswaMonitoring from "./SiswaMonitoring";
import AngketEvaluasiTutor from "./AngketEvaluasiTutor";

interface RombelData {
  id: number;
  nama: string;
}

// Static all 12 levels
const ALL_LEVELS = [
  { id: "I", namaIndonesia: "Satu", program: "Paket A (Kelas I-VI)" },
  { id: "II", namaIndonesia: "Dua", program: "Paket A (Kelas I-VI)" },
  { id: "III", namaIndonesia: "Tiga", program: "Paket A (Kelas I-VI)" },
  { id: "IV", namaIndonesia: "Empat", program: "Paket A (Kelas I-VI)" },
  { id: "V", namaIndonesia: "Lima", program: "Paket A (Kelas I-VI)" },
  { id: "VI", namaIndonesia: "Enam", program: "Paket A (Kelas I-VI)" },
  { id: "VII", namaIndonesia: "Tujuh", program: "Paket B (Kelas VII-IX)" },
  { id: "VIII", namaIndonesia: "Delapan", program: "Paket B (Kelas VII-IX)" },
  { id: "IX", namaIndonesia: "Sembilan", program: "Paket B (Kelas VII-IX)" },
  { id: "X", namaIndonesia: "Sepuluh", program: "Paket C (Kelas X-XII)" },
  { id: "XI", namaIndonesia: "Sebelas", program: "Paket C (Kelas X-XII)" },
  { id: "XII", namaIndonesia: "Dua Belas", program: "Paket C (Kelas X-XII)" },
];

// Extract level from rombel name: "IVA" → "IV", "XA" → "X"
const extractLevelFromRombel = (namaRombel: string): string => {
  const nama = namaRombel.toUpperCase();
  if (nama.length > 1 && /^[A-Z]$/.test(nama.slice(-1))) {
    return nama.slice(0, -1);
  }
  return nama;
};

const getImageByProgram = (program: string): string => {
  if (program.startsWith("Paket A")) return "/paket/paketA.jpg.jpeg";
  if (program.startsWith("Paket B")) return "/paket/paketB.jpg.jpeg";
  if (program.startsWith("Paket C")) return "/paket/paketC.jpg.jpeg";
  return "/paket/paketA.jpg.jpeg";
};

interface KelasLevel {
  id: string;
  nama: string;
  namaIndonesia: string;
  rombels: RombelData[];
  program: string;
  image: string;
}

export default function ElearningAdminDashboard() {
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"kelola" | "monitoring" | "siswa" | "angket">("kelola");
  const [rombels, setRombels] = useState<RombelData[]>([]);
  const [kelasSearch, setKelasSearch] = useState("");

  // Fetch rombels on mount
  useEffect(() => {
    fetch("/api/rombels", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setRombels(data.data.map((r: any) => ({ id: r.id, nama: r.nama })));
        }
      })
      .catch((err) => console.log("Rombel API not available yet.", err));
  }, []);

  // Build all 12 kelas levels, populated with rombels from DB
  const kelasLevels: KelasLevel[] = useMemo(() => {
    const levelMap = new Map<string, RombelData[]>();
    for (const rombel of rombels) {
      const levelId = extractLevelFromRombel(rombel.nama);
      if (!levelMap.has(levelId)) levelMap.set(levelId, []);
      levelMap.get(levelId)!.push(rombel);
    }

    return ALL_LEVELS.map((level) => ({
      id: level.id,
      nama: `KELAS ${level.id}`,
      namaIndonesia: `Kelas ${level.namaIndonesia}`,
      rombels: levelMap.get(level.id) || [],
      program: level.program,
      image: getImageByProgram(level.program),
    }));
  }, [rombels]);

  // Filtered kelas by search
  const filteredKelasLevels = useMemo(() => {
    const q = kelasSearch.trim().toLowerCase();
    if (!q) return kelasLevels;
    return kelasLevels.filter((level) =>
      level.nama.toLowerCase().includes(q) ||
      level.namaIndonesia.toLowerCase().includes(q) ||
      level.program.toLowerCase().includes(q) ||
      level.rombels.some((r) => r.nama.toLowerCase().includes(q))
    );
  }, [kelasLevels, kelasSearch]);

  const selectedKelas = selectedKelasId ? kelasLevels.find((l) => l.id === selectedKelasId) : null;

  const tabs = [
    { id: "kelola", label: "Kelola Elearning", icon: <Layers className="w-4 h-4" /> },
    { id: "monitoring", label: "Tutor", icon: <Activity className="w-4 h-4" /> },
    { id: "siswa", label: "Nilai Warga Belajar", icon: <Users className="w-4 h-4" /> },
    { id: "angket", label: "Angket Evaluasi Tutor", icon: <FileQuestion className="w-4 h-4" /> },
  ] as const;

  // Phase 1: Class selection grid
  if (!selectedKelasId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-cyan-900 tracking-tight">Manajemen E-Learning Nasional</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Pilih kelas terlebih dahulu untuk mengelola e-learning, tutor, nilai, dan angket evaluasi.
          </p>
        </div>

        {/* DAFTAR KELAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#280f91] text-white px-4 py-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" />
              DAFTAR KELAS
            </h3>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
              <input
                type="text"
                value={kelasSearch}
                onChange={(e) => setKelasSearch(e.target.value)}
                placeholder="Cari kelas..."
                className="w-full rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/40 pl-8 pr-8 py-1.5 text-xs font-medium outline-none focus:bg-white/20 focus:border-white/40"
              />
              {kelasSearch && (
                <button
                  type="button"
                  onClick={() => setKelasSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4">
            {filteredKelasLevels.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400 font-medium">
                Tidak ada kelas yang cocok.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredKelasLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedKelasId(level.id);
                      setActiveTab("kelola");
                    }}
                    className="flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden group border-slate-100 hover:border-[#280f91] hover:shadow-md hover:ring-2 hover:ring-purple-100"
                  >
                    {/* Foto Paket */}
                    <div className="w-full aspect-square bg-slate-100 overflow-hidden relative">
                      <img
                        src={level.image}
                        alt={level.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 pt-10">
                        <span className="font-black text-sm text-white block text-center drop-shadow-lg">
                          {level.nama}
                        </span>
                      </div>
                    </div>
                    {/* Info Kelas */}
                    <div className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          level.rombels.length > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {level.rombels.length} rombel
                        </span>
                      </div>
                      {level.rombels.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-0.5 justify-center">
                          {level.rombels.slice(0, 3).map(r => (
                            <span key={r.id} className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                              {r.nama}
                            </span>
                          ))}
                          {level.rombels.length > 3 && (
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">+{level.rombels.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Tabs + content after selecting a class
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with back button */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedKelasId(null)}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedKelas?.nama || "E-Learning"}
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {selectedKelas?.program} · {selectedKelas?.rombels.length || 0} rombel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#280f91] text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#280f91]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "kelola" && <KelolaElearning initialKelasId={selectedKelasId} />}
        {activeTab === "monitoring" && <TutorMonitoring initialLevel={selectedKelasId || undefined} />}
        {activeTab === "siswa" && <SiswaMonitoring initialLevel={selectedKelasId || undefined} />}
        {activeTab === "angket" && <AngketEvaluasiTutor />}
      </div>
    </div>
  );
}
