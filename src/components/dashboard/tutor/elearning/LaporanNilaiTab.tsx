import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Lock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  activeTab?: string;
  user?: any;
}

interface StudentGradeData {
  id: number;
  nama: string;
  kelas: string;
  tugas: number;
  partisipasi: number;
  kehadiran: number;
  final: number;
  predikat: string;
}

export default function LaporanNilaiTab({ activeTab, user }: Props) {
  const [students, setStudents] = useState<StudentGradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const parts = activeTab?.split("-") || [];
  const setupId = parts[1] === "setup" ? parseInt(parts[2], 10) : null;

  useEffect(() => {
    async function fetchData() {
      if (!setupId) return;
      try {
        setLoading(true);
        // Fetch setup to know which kelas
        const setupRes = await fetch(`/api/elearning/setups?tutorId=${user?.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const setupData = await setupRes.json();
        const setup = setupData?.data?.find((s: any) => s.id === setupId);
        if (!setup) throw new Error("Setup tidak ditemukan");

        const gradesRes = await fetch(`/api/elearning/grades?setupId=${setupId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const gradesData = await gradesRes.json();
        
        if (gradesData.success) {
          setStudents(gradesData.data);
        }
      } catch (err: any) {
        toast.error("Gagal memuat data siswa", { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setupId, user]);

  const handleExport = () => {
    if (students.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    // Generate CSV content
    const header = "Nama Warga Belajar,Nilai Tugas,Nilai Diskusi,Nilai Kehadiran,Nilai Akhir,Predikat\n";
    const rows = students.map(student => 
      `"${student.nama}",${student.tugas},${student.partisipasi},${student.kehadiran},${student.final.toFixed(1)},"${student.predikat}"`
    ).join("\n");
    
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "laporan_nilai_warga_belajar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Berhasil mengunduh laporan nilai (.CSV)");
  };

  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Ekspor */}
      <div className="flex justify-between items-center bg-[#280f91] text-white p-6 rounded-2xl shadow-md">
        <div>
          <h3 className="text-xl font-black mb-1">Rekap Nilai Keseluruhan</h3>
          <p className="text-sm text-indigo-200 font-medium">Unduh data akhir partisipasi, diskusi, dan tugas mahasiswa.</p>
        </div>
        <Button onClick={handleExport} className="bg-[#ff6105] hover:bg-white hover:text-[#ff6105] font-bold text-sm h-10 px-6 transition-colors shadow-lg cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Ekspor (.CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        <Card className="p-0 border-slate-200/60 bg-white shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-[#280f91]">Data Nilai Warga Belajar</h3>
              <p className="text-xs font-semibold text-slate-500">Menampilkan siswa di kelas ini (Data Nilai menunggu Integrasi Fase 4).</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91]"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6" rowSpan={2}>Nama Warga Belajar</th>
                  <th className="py-2 px-6 text-center border-b border-slate-200" colSpan={3}>Nilai</th>
                  <th className="py-4 px-6 text-center" rowSpan={2}>Nilai Akhir</th>
                  <th className="py-4 px-6 text-center" rowSpan={2}>Predikat</th>
                </tr>
                <tr className="text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                  <th className="py-2 px-6 text-center border-l border-slate-100">Tugas</th>
                  <th className="py-2 px-6 text-center border-l border-slate-100">Diskusi</th>
                  <th className="py-2 px-6 text-center border-l border-slate-100">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Memuat data...</td>
                  </tr>
                ) : currentStudents.length > 0 ? (
                  currentStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{student.nama}</td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 border-l border-slate-100">{student.tugas}</td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 border-l border-slate-100">{student.partisipasi}</td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 border-l border-slate-100">{student.kehadiran}</td>
                      <td className="py-4 px-6 text-center border-l border-slate-100">
                        <span className="text-[#ff6105] text-sm font-black">{student.final.toFixed(1)}</span>
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-800">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          student.predikat === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          student.predikat === 'B' ? 'bg-blue-100 text-blue-800' :
                          student.predikat === 'C' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.predikat}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Tidak ada data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredStudents.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm text-slate-500 font-medium">
                Halaman <span className="font-bold text-slate-700">{currentPage}</span> dari <span className="font-bold text-slate-700">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Evaluasi Tutor */}
        <Card className="p-6 border-slate-200/60 bg-slate-50 shadow-sm rounded-2xl flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Lock className="w-32 h-32 text-slate-900" />
          </div>
          
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Lock className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-black text-slate-700">Evaluasi Angket Kinerja Tutor</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-white/60 backdrop-blur-sm relative z-10">
            <Lock className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-slate-600 font-black mb-2 text-lg">Skor Evaluasi Terkunci</p>
            <p className="text-sm text-slate-500 font-medium max-w-sm">
              Tutor hanya dapat melihat hasil rekapitulasi angket dari warga belajar setelah nilai semester disahkan dan berstatus final.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
