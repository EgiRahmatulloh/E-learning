import { Award, CheckCircle2, MessageSquare, FileText } from "lucide-react";

interface MapelNilaiProps {
  subjectName: string;
}

export function MapelNilai({ subjectName }: MapelNilaiProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Award className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Rekapitulasi Nilai</h2>
          <p className="text-sm text-slate-500">Mata Pelajaran: {subjectName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kehadiran */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-700">Nilai Kehadiran</h3>
          </div>
          <div className="text-3xl font-black text-emerald-700">100<span className="text-lg text-emerald-600/60">/100</span></div>
          <p className="text-xs text-slate-500 font-medium mt-auto">Hadir di semua sesi (8/8)</p>
        </div>

        {/* Diskusi */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-700">Nilai Diskusi</h3>
          </div>
          <div className="text-3xl font-black text-blue-700">85<span className="text-lg text-blue-600/60">/100</span></div>
          <p className="text-xs text-slate-500 font-medium mt-auto">Rata-rata dari 8 diskusi</p>
        </div>

        {/* Tugas */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="font-bold text-slate-700">Nilai Tugas</h3>
          </div>
          <div className="text-3xl font-black text-orange-700">90<span className="text-lg text-orange-600/60">/100</span></div>
          <p className="text-xs text-slate-500 font-medium mt-auto">Tugas Sesi 3, 5, dan 7</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 mt-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-800">Nilai Akhir Semester</h3>
          <p className="text-sm text-slate-500">Kalkulasi keseluruhan komponen</p>
        </div>
        <div className="text-4xl font-black text-[#280f91]">91.5</div>
      </div>
    </div>
  );
}
