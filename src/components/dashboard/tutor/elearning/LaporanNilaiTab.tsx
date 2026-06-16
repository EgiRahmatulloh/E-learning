import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LaporanNilaiTab({}: { activeTab?: string, user?: any }) {
  const dummyStudents = [
    { id: 1, name: "Ahmad Fauzi", tugas: 85, partisipasi: 90, kehadiran: 100, final: 91.6, predikat: "A" },
    { id: 2, name: "Siti Aminah", tugas: 90, partisipasi: 95, kehadiran: 100, final: 95.0, predikat: "A+" },
    { id: 3, name: "Budi Santoso", tugas: 75, partisipasi: 80, kehadiran: 80, final: 78.3, predikat: "B" },
    { id: 4, name: "Rina Permatasari", tugas: 95, partisipasi: 100, kehadiran: 100, final: 98.3, predikat: "A+" },
  ];

  const handleExport = () => {
    // Generate CSV content
    const header = "Nama Warga Belajar,Nilai Tugas,Nilai Diskusi,Nilai Kehadiran,Nilai Akhir,Predikat\n";
    const rows = dummyStudents.map(student => 
      `"${student.name}",${student.tugas},${student.partisipasi},${student.kehadiran},${student.final.toFixed(1)},"${student.predikat}"`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + header + rows;
    const encodedUri = encodeURI(csvContent);
    
    // Create download link
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_nilai_warga_belajar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Berhasil mengunduh laporan nilai (.CSV)");
  };

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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-[#280f91]">Data Nilai Warga Belajar</h3>
              <p className="text-xs font-semibold text-slate-500">Nilai di bawah ini merupakan data simulasi untuk diekspor.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">Mode Simulasi</span>
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
                {dummyStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{student.name}</td>
                    <td className="py-4 px-6 text-center font-medium text-slate-600 border-l border-slate-100">{student.tugas}</td>
                    <td className="py-4 px-6 text-center font-medium text-slate-600 border-l border-slate-100">{student.partisipasi}</td>
                    <td className="py-4 px-6 text-center font-medium text-slate-600 border-l border-slate-100">{student.kehadiran}</td>
                    <td className="py-4 px-6 text-center border-l border-slate-100">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md font-bold text-xs ${student.final >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {student.final.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-black text-[#280f91]">{student.predikat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
