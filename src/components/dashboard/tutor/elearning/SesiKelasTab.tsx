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

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/elearning/session?courseId=${courseId}&sessionNumber=${sessionNumber}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
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
      </div>

      {/* SEKSI TUGAS FORMAL (Digabungkan dari ManajemenTugasTab) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
        
        {/* Kolom Kiri: Pengaturan Tugas */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl lg:col-span-1 h-fit space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#280f91] mb-1">Pengaturan Tugas {sessionNumber}</h3>
            <p className="text-xs font-semibold text-slate-500">Unggah soal dan atur batas waktu.</p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Unggah File Soal</p>
            <p className="text-xs text-slate-400">.PDF / .DOCX</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                Due Date
              </label>
              <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <span className="text-rose-500">Cut-off Date</span>
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
              <h3 className="text-lg font-black text-[#280f91]">Gradebook Assignment</h3>
              <p className="text-xs font-semibold text-slate-500">24/30 Mahasiswa telah mengumpulkan.</p>
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
                  <th className="pb-3 px-4">File Terkirim</th>
                  <th className="pb-3 px-4 text-center">Nilai</th>
                  <th className="pb-3 px-4">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800">Budi Santoso</td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-bold text-[#280f91] bg-[#280f91]/10 px-2 py-1 rounded cursor-pointer hover:underline">
                      Tugas3_Budi.pdf
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input type="number" defaultValue={85} className="w-16 text-center border-slate-200 rounded p-1 text-sm font-bold focus:border-[#ff6105] outline-none" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2 items-center">
                      <input type="text" placeholder="Catatan..." className="w-full text-xs border-slate-200 rounded p-1.5 focus:border-[#280f91] outline-none" />
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 cursor-pointer" />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800">Siti Aisyah</td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
                      Belum Kirim
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input type="number" placeholder="-" disabled className="w-16 text-center border-slate-100 bg-slate-50 rounded p-1 text-sm font-bold" />
                  </td>
                  <td className="py-4 px-4">
                    <input type="text" placeholder="-" disabled className="w-full text-xs border-slate-100 bg-slate-50 rounded p-1.5" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
