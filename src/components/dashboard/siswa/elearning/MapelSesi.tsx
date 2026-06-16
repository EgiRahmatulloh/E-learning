import { useState } from "react";
import { CheckCircle2, FileText, PlayCircle, MessageSquare, PenTool, Upload, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MapelSesiProps {
  subjectName: string;
  sessionNumber: number;
}

export function MapelSesi({ subjectName, sessionNumber }: MapelSesiProps) {
  const isTugasSession = [3, 5, 7].includes(sessionNumber);
  const isEvaluasiSession = sessionNumber === 7;

  const [discussions, setDiscussions] = useState<{ sender: string; text: string; isSelf: boolean; initial: string; color: string }[]>([
    { sender: "Rina Gunawan", text: "Menurut saya, topik ini sangat relevan dengan yang terjadi di industri saat ini. Terutama pada bagian efisiensi proses.", isSelf: false, initial: "R", color: "bg-purple-600" },
    { sender: "Bambang Pamungkas", text: "Betul sekali. Contoh nyata di lapangan adalah ketika perusahaan mencoba menekan biaya produksi namun tetap mempertahankan kualitas.", isSelf: false, initial: "B", color: "bg-blue-600" }
  ]);
  const [discussionInput, setDiscussionInput] = useState("");

  const [isHadir, setIsHadir] = useState(false);

  const handleSendDiscussion = () => {
    if (!discussionInput.trim()) return;
    setDiscussions([
      ...discussions,
      { sender: "Siswa (Anda)", text: discussionInput, isSelf: true, initial: "S", color: "bg-cyan-600" }
    ]);
    setDiscussionInput("");
  };

  const handleNotAvailable = (item: string) => {
    toast.info("Belum tersedia", {
      description: `${item} belum tersedia atau belum diunggah oleh tutor saat ini.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Kehadiran */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Kehadiran Sesi {sessionNumber}</h2>
            <p className="text-sm text-slate-500">
              {isHadir ? "Anda sudah mengonfirmasi kehadiran untuk sesi ini." : "Klik tombol di samping untuk konfirmasi kehadiran"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsHadir(true)}
          disabled={isHadir}
          className={`rounded-xl font-bold w-full sm:w-auto ${isHadir
              ? "bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
        >
          {isHadir ? "Sudah Hadir" : "Konfirmasi Hadir"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materi Inisiasi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-[#280f91]" />
            <h3 className="font-bold text-slate-700">Materi Inisiasi (PPT)</h3>
          </div>
          <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
            <Button onClick={() => handleNotAvailable("Materi inisiasi")} variant="outline" className="rounded-xl border-slate-200 font-bold text-slate-700">Unduh Materi Sesi {sessionNumber}</Button>
          </div>
        </div>

        {/* Materi Pengayaan */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <PlayCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-slate-700">Materi Pengayaan (Video)</h3>
          </div>
          <button 
            onClick={() => handleNotAvailable("Video pengayaan")} 
            className="w-full h-40 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative cursor-pointer border-none"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
              </div>
            </div>
            <p className="text-white/40 text-xs font-bold absolute bottom-3">Preview YouTube Embed</p>
          </button>
        </div>
      </div>

      {/* Diskusi */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-700">Ruang Diskusi</h3>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-slate-700">
          <p className="font-bold text-blue-800 mb-2">Pertanyaan Pemantik:</p>
          <p>Bagaimana pendapat Anda mengenai topik materi {subjectName} pada sesi {sessionNumber} ini? Berikan contoh kasus di kehidupan sehari-hari.</p>
        </div>

        <div className="space-y-4 my-4">
          {discussions.map((msg, idx) => (
            <div key={idx} className="flex gap-3">
              <div className={`h-8 w-8 rounded-full ${msg.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                {msg.initial}
              </div>
              <div className={`p-3 rounded-lg border shadow-sm flex-1 ${msg.isSelf ? 'bg-cyan-50/30 border-cyan-100' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-xs font-bold mb-1 ${msg.isSelf ? 'text-cyan-700' : 'text-slate-600'}`}>{msg.sender}</p>
                <p className="text-sm text-slate-700">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-slate-100 pt-4">
          <input
            type="text"
            placeholder="Tulis tanggapan Anda..."
            value={discussionInput}
            onChange={(e) => setDiscussionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendDiscussion()}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Button onClick={handleSendDiscussion} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">Kirim</Button>
        </div>
      </div>

      {/* Latihan */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <PenTool className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Latihan Sesi {sessionNumber}</h2>
            <p className="text-sm text-slate-500">Uji pemahaman mandiri (Soal Pilihan Ganda)</p>
          </div>
        </div>
        <Button onClick={() => handleNotAvailable("Soal latihan")} variant="outline" className="rounded-xl border-purple-200 text-purple-700 font-bold hover:bg-purple-50">
          Mulai Latihan
        </Button>
      </div>

      {/* Tugas Khusus (Sesi 3, 5, 7) */}
      {isTugasSession && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-orange-200 pb-3">
            <Upload className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-lg font-black text-orange-900">Tugas Formal {sessionNumber === 3 ? "1" : sessionNumber === 5 ? "2" : "3"}</h2>
              <p className="text-xs text-orange-700">Unduh soal dan kumpulkan jawaban tugas di sini.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => handleNotAvailable("Soal tugas")} variant="outline" className="flex-1 bg-white hover:bg-orange-50 border-orange-200 text-orange-700 font-bold h-12">
              Unduh Soal Tugas
            </Button>
            <Button onClick={() => handleNotAvailable("Fitur unggah jawaban")} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold h-12">
              Unggah Jawaban
            </Button>
          </div>
        </div>
      )}

      {/* Evaluasi Khusus (Sesi 7) */}
      {isEvaluasiSession && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-xl">
              <HelpCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-rose-900">Evaluasi Kinerja Tutor</h2>
              <p className="text-sm text-rose-700">Wajib diisi: Angket penilaian untuk tutor selama semester ini.</p>
            </div>
          </div>
          <Button onClick={() => handleNotAvailable("Angket evaluasi")} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold w-full sm:w-auto">
            Isi Angket
          </Button>
        </div>
      )}

    </div>
  );
}
