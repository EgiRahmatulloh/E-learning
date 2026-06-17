import { Users } from "lucide-react";

export default function SiswaMonitoring() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-cyan-900">Pemantauan Siswa/Warga Belajar</h3>
          <p className="text-sm text-slate-500 font-medium">
            Pantau partisipasi, progres belajar, dan nilai dari warga belajar.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="font-bold">Belum ada data warga belajar.</p>
        <p className="text-sm">Data akan muncul setelah ada interaksi pada sesi kelas.</p>
      </div>
    </div>
  );
}
