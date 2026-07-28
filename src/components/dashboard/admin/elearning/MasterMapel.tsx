import { BookOpen } from "lucide-react";

export const MASTER_MAPEL = {
  "Paket A (Kelas 1-6)": [
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
  "Paket B (Kelas 7-9)": [
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
  "Paket C (Kelas 10-12)": [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam",
    "Ilmu Pengetahuan Sosial",
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#280f91]/10 text-[#280f91] rounded-xl">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Master Mata Pelajaran</h2>
          <p className="text-xs text-slate-500 font-medium">Daftar mata pelajaran standar per paket/program</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(MASTER_MAPEL).map(([paket, mapels]) => (
          <div key={paket} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00badb]"></span>
              <h3 className="font-bold text-slate-800 text-sm">{paket}</h3>
              <span className="ml-auto text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                {mapels.length} Mapel
              </span>
            </div>
            <ul className="space-y-2">
              {mapels.map((m, idx) => (
                <li key={idx} className="text-xs text-slate-600 font-medium flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono w-4 text-right">{idx + 1}.</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
