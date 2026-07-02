import { useState, useEffect } from "react";
import { Users, Search, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadFromTemplate } from "@/lib/downloadTemplate";

interface StudentMonitoringData {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  forumCount?: number;
  kehadiranCount?: number;
  tugasCount?: number;
  avgScore?: number;
}

export default function SiswaMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<StudentMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/elearning/monitoring/students", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error("Failed to load students for monitoring", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Get unique kelas list
  const kelasList = [...new Set(students.map(s => s.kelas))].sort();

  const filtered = students.filter(
    (s) =>
      (selectedKelas === "" || s.kelas === selectedKelas) &&
      (s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sanitizeFilename = (s: string) => s.replace(/[^a-zA-Z0-9._\-\s]/g, "_").replace(/\s+/g, "_");

  const handleExportKehadiran = async () => {
    if (!selectedKelas) {
      toast.warning("Pilih kelas terlebih dahulu");
      return;
    }
    await downloadFromTemplate(
      "/api/elearning/laporan/student-attendance-rekap?kelas=" + encodeURIComponent(selectedKelas),
      "rekap_kehadiran_wb_" + sanitizeFilename(selectedKelas) + ".xlsx"
    );
  };

  const [exporting, setExporting] = useState(false);

  const handleExportNilai = async () => {
    if (exporting) return;
    if (selectedKelas) {
      toast.warning("Kosongkan filter kelas terlebih dahulu untuk cetak rekap nilai keseluruhan");
      return;
    }
    setExporting(true);
    try {
      const endpoint = "/api/elearning/laporan/student-grades-rekap";
      const filename = "rekap_nilai_wb_semua_kelas.xlsx";

      await downloadFromTemplate(endpoint, filename);
    } catch (err: any) {
      toast.error("Gagal mengunduh rekap nilai", { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-cyan-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Pemantauan Warga Belajar
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Pantau partisipasi, progres belajar, dan nilai dari warga belajar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedKelas}
            onChange={(e) => { setSelectedKelas(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#280f91] shadow-xs"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa, NIS, atau kelas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#280f91] shadow-xs"
            />
          </div>
          <Button onClick={handleExportKehadiran} className="bg-[#ff6105] hover:bg-[#e55800] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer shrink-0">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Rekap Kehadiran (.XLSX)
          </Button>
          <Button onClick={handleExportNilai} disabled={exporting || !!selectedKelas} className="bg-[#280f91] hover:bg-[#1e0b6e] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer shrink-0 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> {exporting ? "Mengekspor..." : "Rekap Nilai (.XLSX)"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Warga Belajar ({filtered.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] w-16 text-center">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">NAMA SISWA / NIS</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">ROMBEL (KELAS)</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center">KEHADIRAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center">PARTISIPASI FORUM</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center">TUGAS SELESAI</th>
                <th className="py-4 px-6 text-center">NILAI RATA-RATA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center font-bold text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors">
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <div className="font-extrabold text-slate-900 leading-relaxed uppercase">{s.nama}</div>
                      <div className="text-xs text-slate-500 font-semibold">{s.nis}</div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-600 font-extrabold">{s.kehadiranCount !== undefined ? s.kehadiranCount : 0} HADIR</td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-600 font-extrabold">{s.forumCount !== undefined ? s.forumCount : 0} BALASAN</td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-600 font-extrabold">{s.tugasCount !== undefined ? s.tugasCount : 0} TUGAS</td>
                    <td className="py-4 px-6 text-center font-black text-[#ff6105] text-base">{s.avgScore !== undefined ? s.avgScore : 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data siswa yang sesuai kriteria pencarian.
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
