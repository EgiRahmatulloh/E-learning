import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, AlertTriangle, UserCheck, UserX, Lock } from "lucide-react";

export default function LaporanNilaiTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Ekspor */}
      <div className="flex justify-between items-center bg-[#280f91] text-white p-6 rounded-2xl shadow-md">
        <div>
          <h3 className="text-xl font-black mb-1">Rekap Nilai Keseluruhan</h3>
          <p className="text-sm text-indigo-200 font-medium">Unduh data akhir partisipasi, diskusi, dan tugas mahasiswa.</p>
        </div>
        <Button className="bg-[#ff6105] hover:bg-white hover:text-[#ff6105] font-bold text-sm h-10 px-6 transition-colors shadow-lg">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Ekspor (.XLSX)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Partisipasi Mahasiswa */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col h-full">
          <h3 className="text-lg font-black text-[#280f91] mb-4 border-b border-slate-100 pb-3">Status Partisipasi User</h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            
            {/* User Aktif */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Dodi Mulyadi</p>
                  <p className="text-xs font-semibold text-emerald-600">Online 2 jam yang lalu</p>
                </div>
              </div>
            </div>

            {/* User Pasif */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Rina Gunawan</p>
                  <p className="text-xs font-semibold text-rose-600">Never accessed / Pasif</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-200 hover:text-rose-800 h-8 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 mr-1" /> Warning
              </Button>
            </div>

          </div>
        </Card>

        {/* Evaluasi Tutor */}
        <Card className="p-6 border-slate-200/60 bg-slate-50 shadow-sm rounded-2xl flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Lock className="w-32 h-32 text-slate-900" />
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-black text-slate-700">Evaluasi Angket Kinerja Tutor</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-white/50 backdrop-blur-sm z-10">
            <p className="text-slate-600 font-semibold mb-2">Skor Evaluasi Terkunci</p>
            <p className="text-sm text-slate-500 max-w-[250px]">
              Tutor hanya dapat melihat hasil angket setelah nilai semester disahkan dan final.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
