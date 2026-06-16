import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Users, GraduationCap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SyncMasterData() {
  const [isSyncing, setIsSyncing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSync = (type: "siswa" | "tutor") => {
    setIsSyncing(true);
    timerRef.current = setTimeout(() => {
      setIsSyncing(false);
      toast.success(`Sinkronisasi data ${type === "siswa" ? "Warga Belajar" : "Tutor"} berhasil!`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sync Warga Belajar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Sinkronisasi Warga Belajar</h3>
            <p className="text-xs text-slate-500 mt-1">Tarik data siswa terbaru dari Master Data ke sistem E-Learning.</p>
          </div>
          <Button
            onClick={() => handleSync("siswa")}
            disabled={isSyncing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
            Tarik Data Siswa
          </Button>
        </div>

        {/* Sync Tutor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Sinkronisasi Data Tutor</h3>
            <p className="text-xs text-slate-500 mt-1">Tarik data tutor terbaru dari Master Data ke sistem E-Learning.</p>
          </div>
          <Button
            onClick={() => handleSync("tutor")}
            disabled={isSyncing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
            Tarik Data Tutor
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">User Role Mapping</h3>
        <p className="text-sm text-slate-500 mb-4">Pilih kelas/mata pelajaran dan tetapkan siapa tutornya dan siapa siswanya (enrollment).</p>
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-400 font-medium">Fitur mapping sedang dalam pengembangan antarmuka (UI).</p>
        </div>
      </div>
    </div>
  );
}
