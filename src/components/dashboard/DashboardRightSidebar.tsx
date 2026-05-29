import {
  BookOpen,
  UserCheck,
  Users,
  FileText,
  BookOpenCheck,
  Eye,
  ClipboardList,
  UserPlus,
  FileCheck,
} from "lucide-react";

export default function DashboardRightSidebar() {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* E-LEARNING Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-cyan-50 to-cyan-100/50 border-2 border-cyan-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            E-Learning
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
            <UserCheck className="h-5 w-5 text-cyan-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-cyan-700 leading-none mb-1">8</span>
            <span className="block text-[10px] font-bold text-cyan-600/80 uppercase tracking-wider">Tutor Aktif</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
            <Users className="h-5 w-5 text-cyan-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-cyan-700 leading-none mb-1">215</span>
            <span className="block text-[10px] font-bold text-cyan-600/80 uppercase tracking-wider">WB Aktif</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-cyan-600/60 italic text-center">Data diambil dari login E-Learning</p>
        </div>
      </div>

      {/* E-UJIAN Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/50 border-2 border-sky-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            E-Ujian
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
            <BookOpenCheck className="h-5 w-5 text-sky-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-sky-700 leading-none mb-1">3</span>
            <span className="block text-[10px] font-bold text-sky-600/80 uppercase tracking-wider">Nama Ujian</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
            <Eye className="h-5 w-5 text-sky-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-sky-700 leading-none mb-1">142</span>
            <span className="block text-[10px] font-bold text-sky-600/80 uppercase tracking-wider">WB Login</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-sky-600/60 italic text-center">Sediakan dulu sebelum diaktifkan</p>
        </div>
      </div>

      {/* E-SPMB Panel */}
      <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/50 border-2 border-blue-200/60 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <h3 className="text-sm font-black text-white tracking-widest text-center uppercase flex items-center justify-center gap-2">
            <ClipboardList className="h-4 w-4" />
            E-SPMB
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <UserPlus className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-blue-700 leading-none mb-1">47</span>
            <span className="block text-[10px] font-bold text-blue-600/80 uppercase tracking-wider">Jumlah Pendaftar</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <FileCheck className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
            <span className="block text-2xl font-black text-blue-700 leading-none mb-1">32</span>
            <span className="block text-[10px] font-bold text-blue-600/80 uppercase tracking-wider">Berkas Lengkap</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-blue-600/60 italic text-center">Sediakan dulu sebelum diaktifkan</p>
        </div>
      </div>
    </div>
  );
}
