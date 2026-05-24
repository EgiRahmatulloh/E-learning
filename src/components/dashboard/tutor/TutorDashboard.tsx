import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TutorDashboard() {
  return (
    <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300">
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
                  onClick={() => alert("Nilai berhasil disimpan!")}
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
                  onClick={() => alert("Nilai berhasil disimpan!")}
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
    </Card>
  );
}
