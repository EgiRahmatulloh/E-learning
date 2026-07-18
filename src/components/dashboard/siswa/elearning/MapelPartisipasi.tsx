import { useState, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapelPartisipasiProps {
  subjectName: string;
  tutorName: string;
  setupId?: number | null;
}

export function MapelPartisipasi({ subjectName, tutorName, setupId }: MapelPartisipasiProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    async function fetchStudents() {
      setLoading(true);
      if (!setupId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/elearning/students-by-setup/${setupId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [setupId]);

  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudents = students.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat daftar siswa...</div>;
  }

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

      <div className="space-y-3">
        {students.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Belum ada siswa yang terdaftar di kelas ini.</p>
        ) : (
          currentStudents.map((student, index) => (
            <div key={student.id || index} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {student.nama ? student.nama.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{student.nama}</p>
                <p className="text-xs text-slate-500 truncate">NIS: {student.nis || '-'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
