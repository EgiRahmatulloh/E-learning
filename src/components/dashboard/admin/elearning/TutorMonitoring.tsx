import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";

export default function TutorMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockTutors = [
    { id: 1, name: "Budi Santoso, M.Pd", mapel: "Matematika", lastLogin: "2 jam lalu", taskUngraded: 12, noDiscussion: true, status: "warning" },
    { id: 2, name: "Siti Aminah, S.Si", mapel: "IPA", lastLogin: "5 hari lalu", taskUngraded: 45, noDiscussion: true, status: "danger" },
    { id: 3, name: "Agus Supriyadi, S.E", mapel: "Ekonomi", lastLogin: "10 menit lalu", taskUngraded: 0, noDiscussion: false, status: "good" },
  ];

  const filtered = mockTutors.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.mapel.toLowerCase().includes(searchTerm.toLowerCase()));



  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Dashboard Kepatuhan Tutor</h3>
          <p className="text-sm text-slate-500">Lacak performa dan aktivitas mengajar tutor.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tutor atau mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Nama Tutor / Mapel</th>
              <th className="py-3 px-4">Login Terakhir</th>
              <th className="py-3 px-4">Tugas Belum Dinilai</th>
              <th className="py-3 px-4">Ruang Diskusi</th>

            </tr>
          </thead>
          <tbody className="text-sm font-medium text-slate-700">
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.mapel}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={t.status === "danger" ? "text-red-500 font-bold" : ""}>{t.lastLogin}</span>
                </td>
                <td className="py-3 px-4">
                  {t.taskUngraded > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-bold text-xs">
                      <ShieldAlert className="w-3 h-3" /> {t.taskUngraded} Tugas
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {t.noDiscussion ? (
                    <span className="text-red-500 text-xs font-bold">Belum Dibuat</span>
                  ) : (
                    <span className="text-emerald-500 text-xs font-bold">Sudah Dibuat</span>
                  )}
                </td>

              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada tutor yang sesuai kriteria pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
