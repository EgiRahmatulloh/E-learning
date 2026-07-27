import { useState, useEffect } from "react";
import { Search, GraduationCap, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFromTemplate } from "@/lib/downloadTemplate";

interface TutorMonitoringData {
  id: number;
  nama: string;
  tutorMapel: string;
  jumlahKelas?: number;
  tugasBelumDinilai?: number;
  diskusiCount?: number;
}

export default function TutorMonitoring({ initialLevel }: { initialLevel?: string } = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(initialLevel || "Semua");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [tutors, setTutors] = useState<TutorMonitoringData[]>([]);
  const [rawSetups, setRawSetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (initialLevel) {
      setSelectedLevel(initialLevel);
    }
  }, [initialLevel]);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [monitoringRes, setupsRes] = await Promise.all([
          fetch("/api/elearning/monitoring/tutors", { headers }),
          fetch("/api/elearning/setups", { headers }),
        ]);

        const monitoringData = await monitoringRes.json();
        if (monitoringData.success) {
          setTutors(monitoringData.data);
        }

        const setupsData = await setupsRes.json();
        if (setupsData.success) {
          setRawSetups(setupsData.data);
          const uniqueKelas = [...new Set(setupsData.data.map((s: any) => s.kelas))] as string[];
          setKelasList(uniqueKelas.sort());
        }
      } catch (err) {
        console.error("Failed to load tutors for monitoring", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  // Derive level dari nama kelas (misal "XA" → "X", "XIIA" → "XII")
  const getLevel = (kelas: string): string => {
    return kelas.replace(/[A-Z]$/, "");
  };

  // Ambil daftar level unik dari kelasList
  const levelList = [...new Set(kelasList.map(getLevel))].sort((a, b) => {
    const romanToNum = (r: string) => {
      const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
      return map[r] || 99;
    };
    return romanToNum(a) - romanToNum(b);
  });

  // Ambil sub-kelas berdasarkan level yang dipilih
  const subKelasList = selectedLevel !== "Semua"
    ? kelasList.filter((k) => getLevel(k) === selectedLevel)
    : [];

  // Reset sub-kelas saat level berubah
  useEffect(() => {
    setSelectedKelas("Semua");
  }, [selectedLevel]);

  const filtered = tutors.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tutorMapel.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedKelas !== "Semua") {
      return rawSetups.some((s) => s.tutorId === t.id && s.kelas === selectedKelas);
    }

    if (selectedLevel !== "Semua") {
      return rawSetups.some((s) => s.tutorId === t.id && getLevel(s.kelas) === selectedLevel);
    }

    return true;
  });

  const handleExportLaporan = () => {
    const today = new Date().toISOString().split("T")[0];
    const filterLabel = selectedKelas !== "Semua"
      ? selectedKelas.replace(/\s+/g, "_")
      : selectedLevel !== "Semua"
        ? `KELAS_${selectedLevel}`
        : "SEMUA_KELAS";
    let params = "";
    if (selectedKelas !== "Semua") {
      params = `?kelas=${encodeURIComponent(selectedKelas)}`;
    } else if (selectedLevel !== "Semua") {
      params = `?level=${encodeURIComponent(selectedLevel)}`;
    }
    downloadFromTemplate(`/api/elearning/laporan/tutor-attendance${params}`, `laporan_kehadiran_tutor_${filterLabel}_${today}.xlsx`);
  };

  const paginatedTutors = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-cyan-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Pemantauan Tutor
          </h3>
          <p className="text-sm text-slate-500 font-medium">Lacak performa dan aktivitas mengajar tutor.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tutor atau mapel..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#280f91] shadow-xs"
            />
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-[#280f91] shadow-xs cursor-pointer"
          >
            <option value="Semua">Semua Level</option>
            {levelList.map((l) => (
              <option key={l} value={l}>Kelas {l}</option>
            ))}
          </select>
          {selectedLevel !== "Semua" && subKelasList.length > 1 && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-[#280f91] shadow-xs cursor-pointer"
            >
              <option value="Semua">Semua {selectedLevel}</option>
              {subKelasList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
          <Button onClick={handleExportLaporan} className="bg-[#ff6105] hover:bg-[#e55800] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer shrink-0">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Laporan (.XLSX)
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Tutor ({filtered.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] w-16 text-center">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">NAMA TUTOR / MAPEL BASE</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center">JUMLAH KELAS</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center">TUGAS BELUM DINILAI</th>
                <th className="py-4 px-6 text-center">RUANG DISKUSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center font-bold text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedTutors.length > 0 ? (
                paginatedTutors.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors">
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <div className="font-extrabold text-slate-900 leading-relaxed uppercase">{t.nama}</div>
                      <div className="text-xs text-slate-500 font-semibold">{t.tutorMapel}</div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span className="text-slate-600 font-extrabold">{t.jumlahKelas !== undefined ? t.jumlahKelas : 0}</span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span className="text-slate-600 font-extrabold">{t.tugasBelumDinilai !== undefined ? t.tugasBelumDinilai : 0}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-slate-600 font-extrabold">{t.diskusiCount !== undefined ? t.diskusiCount : 0} BALASAN</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada tutor yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {(() => {
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        return totalPages > 1 && (
          <div className="flex justify-end items-center gap-2.5 mt-4">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
            >
              Previous
            </Button>

            <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
              {currentPage}
            </span>

            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
            >
              Next
            </Button>
          </div>
        );
      })()}
    </div>
  );
}
