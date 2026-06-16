import { BookOpen } from "lucide-react";

export const MASTER_MAPEL = {
  "Paket A": [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam dan Sosial",
    "PJOK",
    "Seni Budaya",
    "Bahasa Inggris",
    "Pemberdayaan",
    "Keterampilan"
  ],
  "Paket B": [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam",
    "Ilmu Pengetahuan Sosial",
    "Bahasa Inggris",
    "PJOK",
    "Seni",
    "Pemberdayaan",
    "Keterampilan"
  ],
  "Paket C (Kelas X)": [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam",
    "Ilmu Pengetahuan Sosial",
    "Bahasa Inggris",
    "PJOK",
    "Seni",
    "Pemberdayaan",
    "Keterampilan"
  ],
  "Paket C (Kelas XI dan XII)": [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Bahasa Inggris",
    "PJOK",
    "Seni",
    "Sejarah",
    "Sosiologi",
    "Ekonomi",
    "Geografi",
    "Informatika",
    "Pemberdayaan",
    "Keterampilan"
  ]
};

export default function MasterMapel() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="p-3 bg-purple-50 rounded-xl">
            <BookOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Daftar Mata Pelajaran Tetap</h3>
            <p className="text-sm text-slate-500">Tabel referensi mata pelajaran berdasarkan Program/Paket.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(MASTER_MAPEL).map(([paket, mapels]) => (
            <div key={paket} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                <h4 className="font-bold text-[#280f91]">{paket}</h4>
              </div>
              <ul className="divide-y divide-slate-200 text-sm">
                {mapels.map((mapel, idx) => (
                  <li key={idx} className="px-4 py-2 text-slate-700 flex gap-2">
                    <span className="text-slate-400 font-mono w-5">{idx + 1}.</span>
                    <span className="font-semibold">{mapel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
