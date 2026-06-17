import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, UploadCloud, Save, Upload, Users, MessageSquare, PenTool, FileText, PlayCircle } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { getSubjectsSiswa } from "../../DashboardSidebar";

interface Props {
  activeTab?: string;
  user?: any;
}

export default function SesiKelasTab({ activeTab, user }: Props) {
  const [activeSesi, setActiveSesi] = useState<number>(1);
  const [courseId, setCourseId] = useState<number | null>(null);

  const subjectSlug = activeTab?.split("-").slice(1, -1).join("-");
  const allMapels = getSubjectsSiswa(user?.program, user?.kelas);
  const subjectName = allMapels.find((m: string) => m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") === subjectSlug) || subjectSlug;

  useEffect(() => {
    async function fetchCourse() {
      if (!subjectName) return;
      try {
        const res = await fetch("/api/elearning/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectName, program: user?.program, kelas: user?.kelas })
        });
        const data = await res.json();
        if (data.success) {
          setCourseId(data.data.id);
        }
      } catch (err) {}
    }
    fetchCourse();
  }, [subjectName, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sesi) => (
          <Button 
            key={sesi}
            variant={activeSesi === sesi ? "default" : "outline"}
            onClick={() => setActiveSesi(sesi)}
            className={`whitespace-nowrap shrink-0 ${activeSesi === sesi ? "bg-[#280f91] text-white" : "bg-white text-slate-500 border-slate-200"}`}
          >
            Sesi {sesi}
          </Button>
        ))}
      </div>

      {courseId ? (
        <SesiContent courseId={courseId} sessionNumber={activeSesi} />
      ) : (
        <div className="p-6 text-center text-slate-500 animate-pulse">Memuat data kelas...</div>
      )}
    </div>
  );
}

function SesiContent({ courseId, sessionNumber }: { courseId: number, sessionNumber: number }) {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [teksPembuka, setTeksPembuka] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pptFile, setPptFile] = useState<{ title: string, url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const pptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/elearning/session?courseId=${courseId}&sessionNumber=${sessionNumber}`);
        const data = await res.json();
        if (data.success) {
          setSessionId(data.data.session.id);
          setTeksPembuka(data.data.session.description || "");
          const materials = data.data.materials || [];
          const ppt = materials.find((m: any) => m.type === "PPT");
          if (ppt) setPptFile({ title: ppt.title, url: ppt.fileUrl });
          const vid = materials.find((m: any) => m.type === "VIDEO");
          if (vid) setYoutubeUrl(vid.fileUrl);
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [courseId, sessionNumber]);

  const handleSaveTeks = async () => {
    if (!sessionId) return;
    try {
      setSaving(true);
      await fetch(`/api/elearning/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: teksPembuka })
      });
      toast.success(`Teks Pembuka Sesi ${sessionNumber} tersimpan!`);
    } catch (err) {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!sessionId || !youtubeUrl) return;
    try {
      await fetch("/api/elearning/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          title: "Video Pengayaan",
          type: "VIDEO",
          fileUrl: youtubeUrl
        })
      });
      toast.success("Link YouTube berhasil disimpan!");
    } catch (err) {}
  };

  const uploadFileAPI = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !sessionId) return;
    const file = e.target.files[0];
    const toastId = toast.loading(`Mengunggah ${file.name}...`);
    try {
      const fileUrl = await uploadFileAPI(file);
      await fetch("/api/elearning/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          title: file.name,
          type: "PPT",
          fileUrl
        })
      });
      setPptFile({ title: file.name, url: fileUrl });
      toast.success("File PPT berhasil diunggah!", { id: toastId });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message, id: toastId });
    }
  };

  if (loading) return <div className="p-6 text-slate-500 animate-pulse">Memuat sesi...</div>;

  return (
    <div className="space-y-6">
      
      {/* SECTION: Teks Pembuka */}
      <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-black flex items-center gap-2 text-[#280f91] text-lg">
            Teks Pembuka Sesi {sessionNumber}
          </h4>
          <Button size="sm" onClick={handleSaveTeks} disabled={saving} className="bg-[#280f91] hover:bg-indigo-700 text-white font-bold">
            <Save className="w-4 h-4 mr-1.5" /> Simpan Teks
          </Button>
        </div>
        <RichTextEditor value={teksPembuka} onChange={setTeksPembuka} placeholder="Tuliskan materi pengantar sesi ini..." />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION: Kehadiran */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#280f91] text-lg leading-tight">Presensi Kehadiran</h4>
            </div>
            <p className="text-sm text-slate-500 mb-4">Daftar kehadiran warga belajar pada sesi ini. Sistem otomatis mencatat siswa yang telah mengklik tombol 'Hadir'.</p>
          </div>
          <Button variant="outline" className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 font-bold">
            Lihat Laporan Kehadiran
          </Button>
        </Card>

        {/* SECTION: Diskusi */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#280f91] text-lg leading-tight">Forum Diskusi</h4>
            </div>
            <p className="text-sm text-slate-500 mb-4">Ruang tanya jawab interaktif antara tutor dan warga belajar terkait topik pembahasan sesi {sessionNumber}.</p>
          </div>
          <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
            Buka Ruang Diskusi
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION: Materi Inisiasi */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-black text-[#280f91] text-lg leading-tight">Materi Inisiasi (Berkas)</h4>
          </div>
          <p className="text-sm text-slate-500 mb-4">Unggah salinan presentasi atau dokumen bacaan utama.</p>
          <div onClick={() => pptInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors group">
            <input type="file" className="hidden" ref={pptInputRef} accept=".ppt,.pptx,.pdf" onChange={handleFileChange} />
            {pptFile ? (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-700 truncate">{pptFile.title}</p>
                <p className="text-xs text-emerald-600 mt-1">Klik untuk mengganti</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-[#280f91] mx-auto mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-600">Unggah File PDF / PPT</p>
              </>
            )}
          </div>
        </Card>

        {/* SECTION: Materi Pengayaan */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h4 className="font-black text-[#280f91] text-lg leading-tight">Materi Pengayaan (YouTube)</h4>
          </div>
          <p className="text-sm text-slate-500 mb-4">Tambahkan video referensi eksternal dari YouTube untuk melengkapi pemahaman.</p>
          <div className="space-y-4">
            <input 
              type="text" 
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#280f91] bg-slate-50"
            />
            <Button onClick={handleSaveVideo} className="w-full bg-[#ff6105] hover:bg-[#e05200] text-white font-bold">
              Simpan Link Video
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION: Latihan */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <PenTool className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#280f91] text-lg leading-tight">Latihan Mandiri</h4>
            </div>
            <p className="text-sm text-slate-500 mb-4">Soal pilihan ganda singkat (Quiz) untuk mengevaluasi pemahaman warga belajar usai membaca materi.</p>
          </div>
          <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 font-bold">
            Kelola Bank Soal Latihan
          </Button>
        </Card>

        {/* SECTION: Tugas Khusus Sesi */}
        <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl flex flex-col justify-between bg-gradient-to-br from-[#280f91] to-[#401bbd] text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-black text-white text-lg leading-tight">Tugas Formal Sesi {sessionNumber}</h4>
            </div>
            <p className="text-sm text-white/80 mb-6 mt-2">Kelola dokumen soal tugas, atur batas waktu pengumpulan, dan berikan penilaian pada lembar jawaban warga belajar.</p>
          </div>
          <div className="space-y-3 mt-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" className="w-full flex-1 font-bold bg-white text-[#280f91] hover:bg-slate-100">
                Pengaturan Soal
              </Button>
              <Button variant="secondary" className="w-full flex-1 font-bold bg-[#ff6105] text-white border-none hover:bg-[#e05200]">
                Buka Gradebook
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
