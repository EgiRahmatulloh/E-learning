import { Card } from "@/components/ui/card";

export function SiswaDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Subject List & Progress */}
      <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-[#280f91]">Modul Belajar & Progress</h3>
          <p className="text-xs text-slate-500 font-semibold">Berikut adalah capaian belajar Anda semester ini.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Bahasa Indonesia (Modul 4: Artikel)</span>
              <span className="text-[#280f91]">85% Selesai</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Matematika (Modul 3: Aljabar)</span>
              <span className="text-[#280f91]">60% Selesai</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-[#280f91] h-2 rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Ilmu Pengetahuan Alam (Modul 5: Ekosistem)</span>
              <span className="text-[#280f91]">40% Selesai</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-[#ff6105] h-2 rounded-full" style={{ width: "40%" }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Simulated Report Card */}
      <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-black text-[#280f91]">Rapor Hasil Belajar Digital (Simulasi)</h3>
          <p className="text-xs text-slate-500 font-semibold">Simulasi nilai rapor tengah semester.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest">
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-4">Nilai Angka</th>
                <th className="py-2.5 px-4">Predikat</th>
                <th className="py-2.5 px-4">Catatan Tutor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 font-black">Bahasa Indonesia</td>
                <td className="py-3 px-4 text-[#280f91]">90</td>
                <td className="py-3 px-4 font-bold text-emerald-600">A</td>
                <td className="py-3 px-4 text-xs font-semibold text-slate-500">Sangat aktif dalam menulis opini.</td>
              </tr>
              <tr className="border-b border-slate-50 font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 font-black">Matematika</td>
                <td className="py-3 px-4 text-[#280f91]">85</td>
                <td className="py-3 px-4 font-bold text-emerald-600">B</td>
                <td className="py-3 px-4 text-xs font-semibold text-slate-500">Kemampuan logika aljabar sangat bagus.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
