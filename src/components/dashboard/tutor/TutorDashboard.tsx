import { Card } from "@/components/ui/card";
import { BookOpen, CalendarDays, FileText, BarChart3, ArrowLeft } from "lucide-react";

export function TutorDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-[#280f91]">E-Learning Ruang Tutor</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Pilih mata pelajaran di sidebar sebelah kiri untuk mulai mengelola kelas Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#ff6105]/10 text-[#ff6105] flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">Pendahuluan</h3>
          <p className="text-xs text-slate-500 mt-2">Unggah kontrak kuliah dan perkenalan dengan mahasiswa.</p>
        </Card>

        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">Manajemen Sesi</h3>
          <p className="text-xs text-slate-500 mt-2">Atur kehadiran, materi pengayaan, dan diskusi mingguan.</p>
        </Card>

        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">Manajemen Tugas</h3>
          <p className="text-xs text-slate-500 mt-2">Unggah soal dan berikan nilai pada lembar jawaban mahasiswa.</p>
        </Card>

        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">Laporan & Nilai</h3>
          <p className="text-xs text-slate-500 mt-2">Rekapitulasi partisipasi kelas dan ekspor laporan nilai akhir.</p>
        </Card>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center text-center mt-8">
        <ArrowLeft className="w-10 h-10 text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-black text-slate-700">Silakan Buka Menu Sidebar</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-2">
          Klik tombol navigasi di kiri untuk memilih Mata Pelajaran yang Anda ampu pada semester ini.
        </p>
      </Card>
    </div>
  );
}
