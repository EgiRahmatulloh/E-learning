import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, UploadCloud, Save, Upload, Users, MessageSquare, PenTool, FileText, PlayCircle, DownloadCloud } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
// Removed getSubjectsSiswa import

interface Props {
  activeTab?: string;
  user?: any;
}

export default function SesiKelasTab({ activeTab, user }: Props) {
  const [courseId, setCourseId] = useState<number | null>(null);

  const parts = activeTab?.split("-") || [];
  // Format: mapel-setup-{setupId}-sesi-{n}
  const setupId = parts[1] === "setup" ? parseInt(parts[2], 10) : null;
  const activeSesi = parts[3] === "sesi" ? parseInt(parts[4], 10) : 1;

  useEffect(() => {
    async function fetchCourse() {
      if (!setupId) return;
      try {
        const setupRes = await fetch(`/api/elearning/setups?tutorId=${user?.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const setupData = await setupRes.json();
        const setup = setupData?.data?.find((s: any) => s.id === setupId);
        if (!setup) throw new Error("Setup E-Learning tidak ditemukan");

        const actualSubject = setup.mapel;
        const actualKelas = setup.kelas;
        const actualProgram = setup.kelas.includes("Paket A") ? "Paket A" : setup.kelas.includes("Paket B") ? "Paket B" : "Paket C";

        const res = await fetch("/api/elearning/course", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ subjectName: actualSubject, program: actualProgram, kelas: actualKelas })
        });
        const data = await res.json();
        if (data.success) {
          setCourseId(data.data.id);
        }
      } catch (err) {}
    }
    fetchCourse();
  }, [setupId, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
  const tugasUploadRef = useRef<HTMLInputElement>(null);

  // Forum state
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [showForum, setShowForum] = useState(false);

  // Attendance state
  const [attendance, setAttendance] = useState<any[]>([]);
  const [showAttendance, setShowAttendance] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/elearning/session?courseId=${courseId}&sessionNumber=${sessionNumber}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        if (data.success) {
          const sId = data.data.session.id;
          setSessionId(sId);
          setTeksPembuka(data.data.session.description || "");
          const materials = data.data.materials || [];
          const ppt = materials.find((m: any) => m.type === "PPT");
          if (ppt) setPptFile({ title: ppt.title, url: ppt.fileUrl });
          const vid = materials.find((m: any) => m.type === "VIDEO");
          if (vid) setYoutubeUrl(vid.fileUrl);
          
          fetchForumPosts(sId);
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [courseId, sessionNumber]);

  const fetchForumPosts = async (sId: number) => {
    try {
      const res = await fetch(`/api/elearning/forum?sessionId=${sId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setForumPosts(data.data || []);
      }
    } catch (err) {}
  };

  const loadAttendance = async () => {
    if (!sessionId) return;
    try {
      // Actually we need an endpoint to get attendance by session id
      // Since it might not exist yet or it's part of another query, let's just make a simple GET to /api/elearning/attendance?sessionId=...
      const res = await fetch(`/api/elearning/attendance?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttendance(data.data || []);
      }
    } catch (err) {}
  };

  const submitReply = async (parentId?: number) => {
    if (!replyText.trim() || !sessionId) return toast.error("Komentar tidak boleh kosong");
    try {
      const res = await fetch("/api/elearning/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          courseId: courseId,
          content: replyText,
          parentId: parentId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Komentar berhasil dikirim!");
        setReplyText("");
        setActiveReplyId(null);
        fetchForumPosts(sessionId);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Gagal mengirim komentar");
    }
  };

  const handleSaveTeks = async () => {
    if (!sessionId) return;
    try {
      setSaving(true);
      await fetch(`/api/elearning/session/${sessionId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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
    const res = await fetch("/api/upload", { 
      method: "POST", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData 
    });
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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
          <Button 
            variant="outline" 
            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 font-bold"
            onClick={() => {
              loadAttendance();
              setShowAttendance(true);
            }}
          >
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
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
            onClick={() => {
              if (sessionId) fetchForumPosts(sessionId);
              setShowForum(true);
            }}
          >
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
      </div>

      {/* SEKSI TUGAS FORMAL (Digabungkan dari ManajemenTugasTab) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
        
        {/* Kolom Kiri: Pengaturan Tugas */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl lg:col-span-1 h-fit space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#280f91] mb-1">Pengaturan Tugas Sesi {sessionNumber}</h3>
            <p className="text-xs font-semibold text-slate-500">Unggah soal dan atur batas waktu tugas.</p>
          </div>

          <div onClick={() => !saving && tugasUploadRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
            <input 
              ref={tugasUploadRef}
              id="tugas-upload" 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0 || !sessionId) return;
                const file = e.target.files[0];
                const toastId = toast.loading(`Mengunggah Tugas: ${file.name}...`);
                try {
                  const fileUrl = await uploadFileAPI(file);
                  await fetch("/api/elearning/material", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                      sessionId,
                      title: `Tugas Sesi ${sessionNumber}`,
                      type: "TUGAS",
                      fileUrl
                    })
                  });
                  toast.success("File Tugas berhasil diunggah!", { id: toastId });
                } catch (err: any) {
                  toast.error("Gagal mengunggah tugas", { description: err.message, id: toastId });
                }
              }} 
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Unggah Berkas Tugas</p>
            <p className="text-xs text-slate-400">.PDF / .DOCX</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                Batas Waktu (Due Date)
              </label>
              <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <span className="text-rose-500">Batas Akhir (Cut-off Date)</span>
              </label>
              <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
            </div>
          </div>
          
          <Button className="w-full bg-[#ff6105] hover:bg-[#e05200] text-white font-bold">Simpan Pengaturan</Button>
        </Card>

        {/* Kolom Kanan: Gradebook */}
        <Card className="p-0 border-slate-200/60 bg-white shadow-sm rounded-2xl lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-[#280f91]">Penilaian Tugas Warga Belajar Sesi {sessionNumber}</h3>
              <p className="text-xs font-semibold text-slate-500">Data ini menunggu integrasi data siswa real.</p>
            </div>
            <Button size="sm" variant="outline" className="border-[#280f91] text-[#280f91] hover:bg-[#280f91] hover:text-white font-bold h-9">
              <DownloadCloud className="w-4 h-4 mr-2" /> Bulk Download (.ZIP)
            </Button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 px-4">Nama Siswa</th>
                  <th className="pb-3 px-4">Berkas Terkirim</th>
                  <th className="pb-3 px-4 text-center">Nilai</th>
                  <th className="pb-3 px-4">Catatan Tutor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td colSpan={4} className="py-8 px-4 text-center font-bold text-slate-500 italic">
                    Belum ada siswa yang mengirim tugas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal Kehadiran */}
      {showAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative">
            <h3 className="text-xl font-black text-[#280f91] mb-4">Laporan Kehadiran Sesi {sessionNumber}</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-xs">
                    <th className="p-3">Siswa ID</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Waktu Konfirmasi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-400">Belum ada data kehadiran</td></tr>
                  ) : (
                    attendance.map((att: any, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">{att.studentId}</td>
                        <td className="p-3 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">Hadir</span></td>
                        <td className="p-3 text-right text-slate-500">{new Date(att.createdAt).toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowAttendance(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700">Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Forum Diskusi */}
      {showForum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-[#280f91] mb-4 border-b border-slate-100 pb-2">Forum Diskusi Sesi {sessionNumber}</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {forumPosts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-slate-100 rounded-xl bg-slate-50/50">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium">Belum ada diskusi pada sesi ini.</p>
                </div>
              ) : (
                forumPosts.filter(p => !p.parentId).map(post => (
                  <div key={post.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${post.authorRole === 'tutor' ? 'bg-[#280f91] text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                        {post.authorName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {post.authorName}
                              {post.authorRole === 'tutor' && <span className="bg-[#ff6105] text-white px-1.5 py-0.5 rounded text-[9px]">TUTOR</span>}
                            </h4>
                            <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-cyan-600 hover:bg-cyan-50" onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}>Balas</Button>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 prose" dangerouslySetInnerHTML={{ __html: post.content }} />
                        
                        {/* Replies */}
                        {forumPosts.filter(r => r.parentId === post.id).map(reply => (
                          <div key={reply.id} className="mt-3 pl-4 border-l-2 border-slate-200 flex gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${reply.authorRole === 'tutor' ? 'bg-[#280f91] text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {reply.authorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                {reply.authorName} 
                                {reply.authorRole === 'tutor' && <span className="bg-[#ff6105] text-white px-1.5 py-0.5 rounded text-[9px]">TUTOR</span>}
                              </h5>
                              <div className="text-xs text-slate-600 prose mt-1" dangerouslySetInnerHTML={{ __html: reply.content }} />
                            </div>
                          </div>
                        ))}

                        {/* Reply Input */}
                        {activeReplyId === post.id && (
                          <div className="mt-4 flex gap-2">
                            <input 
                              type="text"
                              placeholder="Ketik balasan Anda..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && submitReply(post.id)}
                              className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#280f91]"
                            />
                            <Button size="sm" onClick={() => submitReply(post.id)} className="h-9 bg-[#280f91] hover:bg-[#ff6105] text-white">Kirim</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* New Topic Input */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 shrink-0">
              <input 
                type="text"
                placeholder="Tulis pancingan diskusi atau topik baru..."
                value={activeReplyId === null ? replyText : ""}
                onChange={(e) => {
                  setActiveReplyId(null);
                  setReplyText(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                className="flex-1 h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-[#280f91]"
              />
              <Button onClick={() => submitReply()} className="h-10 bg-[#280f91] hover:bg-[#3a1bca] text-white px-6 font-bold">Kirim</Button>
            </div>
            
            <div className="absolute top-4 right-4">
              <Button onClick={() => setShowForum(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">✕</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
