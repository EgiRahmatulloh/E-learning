import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function TutorDashboard() {
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  const showToast = (message: string) => {
    setToast({ message, show: true });
    const timer = setTimeout(() => {
      setToast({ message: "", show: false });
    }, 3000);
    return () => clearTimeout(timer);
  };

  return (
    <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300 relative">
      <div>
        <h3 className="text-lg font-black text-[#280f91]">Penilaian Warga Belajar</h3>
        <p className="text-xs text-slate-500 font-semibold">Silakan berikan evaluasi nilai tugas mingguan warga belajar Paket B & C.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest">
              <th className="py-3 px-4">Nama Siswa</th>
              <th className="py-3 px-4">Mata Pelajaran</th>
              <th className="py-3 px-4">Tugas Terakhir</th>
              <th className="py-3 px-4">Nilai Saat Ini</th>
              <th className="py-3 px-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
              <td className="py-4 px-4 font-black text-slate-800">Ahmad Fauzi</td>
              <td className="py-4 px-4 text-xs">Pendidikan Kewarganegaraan</td>
              <td className="py-4 px-4 text-xs font-bold text-[#ff6105]">Tugas 3: Integrasi Sosial</td>
              <td className="py-4 px-4 font-black text-slate-800">85 / 100</td>
              <td className="py-4 px-4">
                <Button 
                  onClick={() => showToast("Nilai Ahmad Fauzi berhasil disimpan!")}
                  size="sm" 
                  className="rounded-lg bg-[#280f91] hover:bg-[#ff6105] text-white font-bold text-xs h-8 px-3 cursor-pointer transition-colors"
                >
                  Update Nilai
                </Button>
              </td>
            </tr>
            <tr className="border-b border-slate-50 font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
              <td className="py-4 px-4 font-black text-slate-800">Siti Rahma</td>
              <td className="py-4 px-4 text-xs">Bahasa Indonesia</td>
              <td className="py-4 px-4 text-xs font-bold text-[#ff6105]">Tugas 4: Artikel Opini</td>
              <td className="py-4 px-4 font-black text-slate-800">90 / 100</td>
              <td className="py-4 px-4">
                <Button 
                  onClick={() => showToast("Nilai Siti Rahma berhasil disimpan!")}
                  size="sm" 
                  className="rounded-lg bg-[#280f91] hover:bg-[#ff6105] text-white font-bold text-xs h-8 px-3 cursor-pointer transition-colors"
                >
                  Update Nilai
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Floating Modern Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </Card>
  );
}
