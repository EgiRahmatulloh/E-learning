import { Users } from "lucide-react";

interface MapelPartisipasiProps {
  subjectName: string;
  tutorName: string;
}

export function MapelPartisipasi({ subjectName, tutorName }: MapelPartisipasiProps) {
  // Dummy data
  const students = [
    "Ahmad Budi", "Siti Nurhaliza", "Bambang Pamungkas", 
    "Rina Gunawan", "Dewi Sartika", "Rudi Hartono"
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="p-3 bg-cyan-50 rounded-xl">
          <Users className="h-6 w-6 text-cyan-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Daftar Partisipasi Kelas</h2>
          <p className="text-sm text-slate-500">Mata Pelajaran: {subjectName} • Tutor: {tutorName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {students.map((name, index) => (
          <div key={index} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{name}</p>
              <p className="text-xs text-slate-500">Siswa Aktif</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
