import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BlueprintManager() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  const handleGenerate = () => {
    if (!newCourseName.trim()) {
      toast.error("Nama Mata Pelajaran tidak boleh kosong");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success(`Template Course "${newCourseName}" berhasil digandakan dengan 8 sesi!`);
      setNewCourseName("");
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-black text-cyan-900 tracking-tight">Master Template Course (Blueprint)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gunakan fitur ini untuk membuat satu struktur kelas standar yang otomatis terdiri dari:
            <br />- <strong>Pendahuluan</strong> (RAT, Tata Tertib, Perkenalan)
            <br />- <strong>Sesi 1 hingga 8</strong> (Materi Inisiasi, Materi Pengayaan, Diskusi, Latihan)
            <br />- <strong>Tugas Formal</strong> yang otomatis terbuka hanya di Sesi 3, 5, dan 7.
            <br />- <strong>Angket Evaluasi Tutor</strong> yang otomatis tersemat di Sesi 7.
          </p>
        </div>
        <div className="w-full md:w-80 bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4 shrink-0">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nama Mapel Baru</label>
            <input
              type="text"
              placeholder="Contoh: Matematika Dasar Paket C"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold focus:border-[#280f91] outline-none"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-[#280f91] to-[#401bbd] hover:opacity-90 text-white font-bold py-2.5 h-auto rounded-xl"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderPlus className="w-4 h-4 mr-2" />}
            Generate Template
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4">Struktur Blueprint Otomatis</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sesi) => (
            <div key={sesi} className={`p-3 rounded-lg border ${[3,5,7].includes(sesi) ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className={`w-3.5 h-3.5 ${[3,5,7].includes(sesi) ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm text-slate-700">Sesi {sesi}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Materi, Diskusi, Latihan
                {[3, 5, 7].includes(sesi) && <div className="text-orange-600 font-bold mt-0.5">+ Upload Tugas</div>}
                {sesi === 7 && <div className="text-cyan-600 font-bold mt-0.5">+ Angket Tutor</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
