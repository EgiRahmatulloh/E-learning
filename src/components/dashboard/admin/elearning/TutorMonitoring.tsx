import { useState, useEffect } from "react";
import { Search, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorMonitoringData {
  id: number;
  nama: string;
  tutorMapel: string;
  tugasBelumDinilai?: number;
  diskusiCount?: number;
}

export default function TutorMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tutors, setTutors] = useState<TutorMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch("/api/elearning/monitoring/tutors", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (data.success) {
          setTutors(data.data);
        }
      } catch (err) {
        console.error("Failed to load tutors for monitoring", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const filtered = tutors.filter(
    (t) =>
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tutorMapel.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tutor atau mapel..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#280f91] shadow-xs"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-6">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Tutor / Mapel Base</th>
                <th className="py-3 px-4 text-center">Tugas Belum Dinilai</th>
                <th className="py-3 px-4 text-center">Ruang Diskusi</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedTutors.length > 0 ? (
                paginatedTutors.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{t.nama}</div>
                      <div className="text-xs text-slate-500">{t.tutorMapel}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-600 font-bold">{t.tugasBelumDinilai !== undefined ? t.tugasBelumDinilai : 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-600 font-bold">{t.diskusiCount !== undefined ? t.diskusiCount : 0} Balasan</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada tutor yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filtered.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs font-semibold text-slate-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} tutor
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs font-bold text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-cyan-600 text-white shadow-md' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                className="h-8 text-xs font-bold text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
