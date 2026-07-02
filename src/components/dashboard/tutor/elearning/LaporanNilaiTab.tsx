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
  const [subTab, setSubTab] = useState<"nilai" | "kehadiran">("kehadiran");
  const [students, setStudents] = useState<StudentGradeData[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [daysInMonth, setDaysInMonth] = useState(31);
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

        const attRes = await fetch(`/api/elearning/laporan/student-attendances?setupId=${setupId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const attData = await attRes.json();
        
        if (attData.success) {
          setAttendances(attData.data);
          setDaysInMonth(attData.daysInMonth || 31);
        }
      } catch (err: any) {
        toast.error("Gagal memuat data siswa", { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setupId, user]);

  const handleExportNilai = async () => {
    if (!setupId) return;
    try {
      const token = localStorage.getItem("token");
      const url = `/api/elearning/laporan/student-grades?setupId=${setupId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Gagal mengunduh file nilai");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `nilai_wb_${setupId}.xlsx`; // Will be overridden by Content-Disposition if browser supports it, but fallback is good
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
      toast.success("Berhasil mengunduh laporan nilai (.XLSX)");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportHadir = async () => {
    if (!setupId) return;
    try {
      const token = localStorage.getItem("token");
      const url = `/api/elearning/laporan/student-attendance?setupId=${setupId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Gagal mengunduh file kehadiran");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `kehadiran_wb_${setupId}.xlsx`;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
      toast.success("Berhasil mengunduh daftar hadir (.XLSX)");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAttendances = attendances.filter(s => s.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil((subTab === 'nilai' ? filteredStudents.length : filteredAttendances.length) / itemsPerPage) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentAttendances = filteredAttendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderKehadiranTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr className="text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <th className="py-4 px-6 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Nama Warga Belajar</th>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th key={i} className="py-4 px-2 text-center border-l border-slate-100 min-w-[30px]">{i + 1}</th>
            ))}
            <th className="py-4 px-6 text-center border-l border-slate-200 sticky right-0 bg-slate-50 z-10">Rekap (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr><td colSpan={daysInMonth + 2} className="py-8 text-center text-slate-400 font-medium">Memuat data...</td></tr>
          ) : currentAttendances.length > 0 ? (
            currentAttendances.map((student, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2 px-6 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-100">{student.namaSiswa}</td>
                {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                  const val = student[`d${dayIdx + 1}`];
                  return (
                    <td key={dayIdx} className="py-2 px-2 text-center border-l border-slate-100">
                      {val === "H" ? (
                        <span className="text-emerald-600 font-bold">H</span>
                      ) : val === "A" ? (
                        <span className="text-red-500 font-bold">A</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-6 text-center font-black text-[#ff6105] border-l border-slate-100 sticky right-0 bg-white">
                  {student.rekap}%
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={daysInMonth + 2} className="py-8 text-center text-slate-400 font-medium">Tidak ada data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Ekspor */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#280f91] text-white p-6 rounded-2xl shadow-md gap-4">
        <div>
          <h3 className="text-xl font-black mb-1">Laporan Daftar Hadir & Nilai</h3>
          <p className="text-sm text-indigo-200 font-medium">Unduh data daftar hadir dan rekap nilai akhir warga belajar.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExportHadir} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-10 px-4 transition-colors shadow-lg cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Daftar Hadir
          </Button>
          <Button onClick={handleExportNilai} className="bg-[#ff6105] hover:bg-white hover:text-[#ff6105] font-bold text-sm h-10 px-4 transition-colors shadow-lg cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Nilai Akhir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        <Card className="p-0 border-slate-200/60 bg-white shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col justify-between items-start gap-4 bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between w-full items-center gap-4">
              <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => { setSubTab("kehadiran"); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    subTab === "kehadiran" ? "bg-white text-[#280f91] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  Daftar Hadir
                </button>
                <button
                  onClick={() => { setSubTab("nilai"); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    subTab === "nilai" ? "bg-white text-[#280f91] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  Daftar Nilai
                </button>
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91] shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-[#280f91]">
                {subTab === "kehadiran" ? "Data Daftar Hadir Warga Belajar" : "Data Nilai Warga Belajar"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {subTab === "kehadiran" ? "Menampilkan rekapitulasi kehadiran warga belajar bulan ini." : "Menampilkan siswa di kelas ini (Data Nilai menunggu Integrasi Fase 4)."}
              </p>
            </div>
          </div>
          
          {subTab === "kehadiran" ? renderKehadiranTable() : (
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
                        <span className="text-[#ff6105] text-sm font-black">{student.final?.toFixed(1) ?? "-"}</span>
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
          )}

          {!loading && (subTab === 'nilai' ? filteredStudents.length > 0 : filteredAttendances.length > 0) && (
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
