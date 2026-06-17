import { useState, useEffect } from "react";
import { CheckCircle2, FileText, PlayCircle, MessageSquare, PenTool, Upload, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MapelSesiProps {
  subjectName: string;
  sessionNumber: number;
  user?: any;
}

export function MapelSesi({ subjectName, sessionNumber, user }: MapelSesiProps) {
  const isTugasSession = [3, 5, 7].includes(sessionNumber);
  const isEvaluasiSession = sessionNumber === 7;

  const [discussions, setDiscussions] = useState<{ sender: string; text: string; isSelf: boolean; initial: string; color: string }[]>([]);
  const [discussionInput, setDiscussionInput] = useState("");

  const [isHadir, setIsHadir] = useState(false);
  const [loading, setLoading] = useState(true);

  const [teksPembuka, setTeksPembuka] = useState("");
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showAngket, setShowAngket] = useState(false);
  const [angketQuestions, setAngketQuestions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const courseRes = await fetch("/api/elearning/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectName, program: user?.program, kelas: user?.kelas })
        });
        const courseData = await courseRes.json();
        if (!courseData.success) return;

        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=${sessionNumber}`);
        const sessionData = await sessionRes.json();
        if (!sessionData.success) return;
        
        if (sessionData.data.session.description) {
          setTeksPembuka(sessionData.data.session.description);
        }

        const materials = sessionData.data.materials || [];
        const ppt = materials.find((m: any) => m.type === "PPT");
        if (ppt) setPptUrl(ppt.fileUrl);
        
        const video = materials.find((m: any) => m.type === "VIDEO");
        if (video) setVideoUrl(video.fileUrl);

        if (sessionNumber === 7) {
          const evalRes = await fetch("/api/elearning/evaluations");
          const evalData = await evalRes.json();
          if (evalData.success && evalData.data.length > 0) {
            setAngketQuestions(evalData.data.map((q: any) => q.question));
          } else {
            setAngketQuestions([
              "Tutor menguasai materi pembelajaran dengan baik.",
              "Tutor merespon pertanyaan dengan cepat dan jelas.",
              "Materi yang diberikan mudah dipahami."
            ]);
          }
        }

      } catch (err) {
        console.error("Failed to load sesi data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [subjectName, sessionNumber, user?.program, user?.kelas]);

  const handleSendDiscussion = () => {
    if (!discussionInput.trim()) return;
    setDiscussions([
      ...discussions,
      { sender: "Siswa (Anda)", text: discussionInput, isSelf: true, initial: "S", color: "bg-cyan-600" }
    ]);
    setDiscussionInput("");
  };

  const handleDownload = (url: string | null) => {
    if (!url) {
      toast.info("Belum tersedia", {
        description: "Materi belum diunggah oleh tutor saat ini."
      });
      return;
    }
    window.open(url, "_blank");
  };

  const handleNotAvailable = (item: string) => {
    toast.info("Belum tersedia", {
      description: `${item} belum tersedia atau belum diunggah oleh tutor saat ini.`
    });
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat data sesi...</div>;
  }

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
        {/* Teks Pembuka (jika ada) */}
        {teksPembuka && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 prose prose-sm max-w-none prose-slate">
            <h3 className="font-bold text-[#280f91] not-prose mb-3">Pengantar Sesi {sessionNumber}</h3>
            <div dangerouslySetInnerHTML={{ __html: teksPembuka }} />
          </div>
        )}
        {/* Materi Inisiasi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-[#280f91]" />
            <h3 className="font-bold text-slate-700">Materi Inisiasi (PPT)</h3>
          </div>
          <div className="flex-1 min-h-[160px] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-6 text-center flex-col gap-4">
            {pptUrl ? (
              <>
                <FileText className="h-12 w-12 text-[#280f91] opacity-50" />
                <Button onClick={() => handleDownload(pptUrl)} variant="outline" className="rounded-xl border-slate-200 font-bold text-slate-700">
                  <Download className="w-4 h-4 mr-2" /> Unduh Materi PPT/PDF
                </Button>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-400">Materi inisiasi belum diunggah</p>
            )}
          </div>
        </div>

        {/* Materi Pengayaan */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <PlayCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-slate-700">Materi Pengayaan (Video)</h3>
          </div>
          <div className="flex-1 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative border-none">
            {videoUrl && extractYoutubeId(videoUrl) ? (
              <iframe
                width="100%"
                height="100%"
                className="absolute inset-0"
                src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : videoUrl ? (
              <Button onClick={() => handleDownload(videoUrl)} className="bg-red-600 hover:bg-red-700">Buka Link Video</Button>
            ) : (
              <div className="text-center p-6">
                <PlayCircle className="h-12 w-12 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-xs font-bold">Materi pengayaan belum diunggah</p>
              </div>
            )}
          </div>
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
          <Button onClick={() => setShowAngket(true)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold w-full sm:w-auto">
            Isi Angket
          </Button>
        </div>
      )}

      {showAngket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <HelpCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-lg">Angket Evaluasi Tutor</h3>
                  <p className="text-xs font-semibold text-rose-600/80">Kuesioner Wajib Akhir Semester</p>
                </div>
              </div>
              <button onClick={() => setShowAngket(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {angketQuestions.map((q, idx) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-4">{idx + 1}. {q}</p>
                  <div className="flex justify-between items-center gap-2">
                    {["Sangat Kurang", "Kurang", "Cukup", "Baik", "Sangat Baik"].map((label, i) => (
                      <label key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                        <input type="radio" name={`q_${idx}`} className="w-4 h-4 text-rose-600 accent-rose-600 focus:ring-rose-500" />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 group-hover:text-rose-600 text-center leading-tight">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <Button 
                  onClick={() => {
                    toast.success("Terima kasih! Angket berhasil dikirimkan.");
                    setShowAngket(false);
                  }}
                  className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-90 text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-rose-200"
                >
                  Kirim Evaluasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
