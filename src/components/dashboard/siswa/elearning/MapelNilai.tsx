import { useState, useEffect } from "react";
import { Award, CheckCircle2, MessageSquare, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface MapelNilaiProps {
  subjectName: string;
  setupId?: number | null;
  user?: any;
}

export function MapelNilai({ subjectName, setupId, user }: MapelNilaiProps) {
  const [gradeData, setGradeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedKehadiran, setExpandedKehadiran] = useState(false);
  const [expandedDiskusi, setExpandedDiskusi] = useState(false);
  const [expandedTugas, setExpandedTugas] = useState(false);

  useEffect(() => {
    async function fetchGrades() {
      setLoading(true);
      if (!setupId || !user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/elearning/grades?setupId=${setupId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        if (data.success) {
          const myGrade = data.data.find((g: any) => Number(g.id) === Number(user.id)) || null;
          setGradeData(myGrade);
        }
      } catch (err) {
        console.error("Failed to fetch grades", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [setupId, user]);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat rekapitulasi nilai...</div>;
  }

  const sessionsCount = gradeData?.sessionsCount || 8;
  const kehadiranBobotPerSesi = (20 / sessionsCount).toFixed(2);
  const diskusiBobotPerSesi = (30 / sessionsCount).toFixed(2);
  const tugasBobotPerSesi = (50 / sessionsCount).toFixed(2);

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

      <div className="grid grid-cols-1 gap-6">
        {/* Kehadiran */}
        <div className="rounded-2xl border border-emerald-100/50 overflow-hidden">
          <button
            onClick={() => setExpandedKehadiran(!expandedKehadiran)}
            className="w-full p-6 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-between text-left transition-colors hover:from-emerald-100 hover:to-teal-100"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-700">Nilai Kehadiran (20%)</h3>
              </div>
              <div className="text-3xl font-black text-emerald-700">{gradeData?.kehadiran || 0}<span className="text-lg text-emerald-600/60">/100</span></div>
            </div>
            <div className="p-2 bg-emerald-200/50 rounded-full text-emerald-700">
              {expandedKehadiran ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>

          {expandedKehadiran && (
            <div className="p-6 bg-white border-t border-emerald-100/50 space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-emerald-800 mb-2">Bobot per sesi: {kehadiranBobotPerSesi}%</h4>
              {gradeData?.detailKehadiran?.map((detail: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Sesi {detail.sessionNumber}</p>
                    <p className={`text-xs font-semibold mt-1 ${detail.hadir ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {detail.hadir ? 'Hadir' : 'Tidak Hadir'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Nilai Kehadiran</p>
                    <p className="font-bold text-emerald-700">{detail.hadir ? '100' : '0'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diskusi */}
        <div className="rounded-2xl border border-blue-100/50 overflow-hidden">
          <button
            onClick={() => setExpandedDiskusi(!expandedDiskusi)}
            className="w-full p-6 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-between text-left transition-colors hover:from-blue-100 hover:to-indigo-100"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-700">Nilai Diskusi (30%)</h3>
              </div>
              <div className="text-3xl font-black text-blue-700">{gradeData?.partisipasi || 0}<span className="text-lg text-blue-600/60">/100</span></div>
            </div>
            <div className="p-2 bg-blue-200/50 rounded-full text-blue-700">
              {expandedDiskusi ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>

          {expandedDiskusi && (
            <div className="p-6 bg-white border-t border-blue-100/50 space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-blue-800 mb-2">Bobot per sesi: {diskusiBobotPerSesi}%</h4>
              {gradeData?.detailDiskusi?.map((detail: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Sesi {detail.sessionNumber}</p>
                    <p className={`text-xs font-semibold mt-1 ${detail.ikutDiskusi ? 'text-blue-600' : 'text-slate-500'}`}>
                      {detail.ikutDiskusi ? 'Aktif Berdiskusi' : 'Tidak Partisipasi'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Nilai Partisipasi</p>
                    <p className="font-bold text-blue-700">{detail.ikutDiskusi ? '100' : '0'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tugas */}
        <div className="rounded-2xl border border-orange-100/50 overflow-hidden">
          <button
            onClick={() => setExpandedTugas(!expandedTugas)}
            className="w-full p-6 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-between text-left transition-colors hover:from-orange-100 hover:to-amber-100"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-slate-700">Nilai Tugas (50%)</h3>
              </div>
              <div className="text-3xl font-black text-orange-700">{gradeData?.tugas || 0}<span className="text-lg text-orange-600/60">/100</span></div>
            </div>
            <div className="p-2 bg-orange-200/50 rounded-full text-orange-700">
              {expandedTugas ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>

          {expandedTugas && (
            <div className="p-6 bg-white border-t border-orange-100/50 space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-orange-800 mb-2">Bobot per sesi: {tugasBobotPerSesi}%</h4>
              {gradeData?.detailTugas?.map((detail: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Tugas Sesi {detail.sessionNumber}</p>
                      <p className="text-xs text-slate-500 mt-1">Bobot Sesi {tugasBobotPerSesi}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Nilai Tugas</p>
                      <p className="font-bold text-orange-700">{detail.grade !== null ? detail.grade : '-'}</p>
                    </div>
                  </div>
                  {detail.feedback && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-orange-100">
                      <p className="text-xs font-bold text-orange-800 mb-1">Catatan/Feedback Tutor:</p>
                      <p className="text-sm text-slate-700">{detail.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-800">Nilai Akhir</h3>
          <p className="text-sm text-slate-500">Kalkulasi keseluruhan komponen</p>
        </div>
        <div className="text-4xl font-black text-[#280f91]">{gradeData?.final ? gradeData.final.toFixed(1) : "0.0"}</div>
      </div>
    </div>
  );
}
