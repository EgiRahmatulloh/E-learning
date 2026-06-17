import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Users, CheckCircle, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { getSubjectsSiswa } from "../../DashboardSidebar";

interface Props {
  activeTab?: string;
  user?: any;
}

export default function PendahuluanTab({ activeTab, user }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setCourseId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [teksPembuka, setTeksPembuka] = useState("");
  const [ratFile, setRatFile] = useState<{ title: string, url: string } | null>(null);
  const [tertibFile, setTertibFile] = useState<{ title: string, url: string } | null>(null);

  const ratInputRef = useRef<HTMLInputElement>(null);
  const tertibInputRef = useRef<HTMLInputElement>(null);

  // Ambil Mapel asli berdasarkan slug (karena activeTab e.g. "mapel-matematika-pendahuluan")
  const subjectSlug = activeTab?.split("-").slice(1, -1).join("-");
  const allMapels = getSubjectsSiswa(user?.program, user?.kelas);
  const subjectName = allMapels.find(m => m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") === subjectSlug) || subjectSlug;

  useEffect(() => {
    async function fetchData() {
      if (!subjectName) return;
      try {
        setLoading(true);
        // 1. Get Course
        const courseRes = await fetch("/api/elearning/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectName, program: user?.program, kelas: user?.kelas })
        });
        const courseData = await courseRes.json();
        if (!courseData.success) throw new Error(courseData.message);
        setCourseId(courseData.data.id);

        // 2. Get Session 0 (Pendahuluan)
        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=0`);
        const sessionData = await sessionRes.json();
        if (!sessionData.success) throw new Error(sessionData.message);
        
        setSessionId(sessionData.data.session.id);
        setTeksPembuka(sessionData.data.session.description || "");

        // Find materials
        const materials = sessionData.data.materials || [];
        const rat = materials.find((m: any) => m.type === "RAT");
        if (rat) setRatFile({ title: rat.title, url: rat.fileUrl });
        const tertib = materials.find((m: any) => m.type === "TATA_TERTIB");
        if (tertib) setTertibFile({ title: tertib.title, url: tertib.fileUrl });

      } catch (error: any) {
        toast.error("Gagal memuat data pendahuluan", { description: error.message });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [subjectName, user]);

  const saveTeksPembuka = async () => {
    if (!sessionId) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/elearning/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: teksPembuka })
      });
      const data = await res.json();
      if (data.success) toast.success("Teks Pembuka berhasil disimpan!");
      else toast.error(data.message);
    } catch (error) {
      toast.error("Gagal menyimpan teks pembuka");
    } finally {
      setSaving(false);
    }
  };

  const uploadFileAPI = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "rat" | "tertib") => {
    if (!e.target.files || e.target.files.length === 0 || !sessionId) return;
    const file = e.target.files[0];
    
    const toastId = toast.loading(`Mengunggah file ${file.name}...`);
    try {
      const fileUrl = await uploadFileAPI(file);
      
      // Save material
      const res = await fetch("/api/elearning/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          title: file.name,
          type: type === "rat" ? "RAT" : "TATA_TERTIB",
          fileUrl
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (type === "rat") {
        setRatFile({ title: file.name, url: fileUrl });
      } else {
        setTertibFile({ title: file.name, url: fileUrl });
      }
      toast.success(`File ${file.name} berhasil diunggah dan disimpan!`, { id: toastId });
    } catch (error: any) {
      toast.error("Gagal mengunggah file", { description: error.message, id: toastId });
    }
  };



  const handleMassReply = () => {
    toast.success("Fitur Balas Massal diaktifkan", {
      description: "Anda sekarang dapat menulis satu balasan untuk semua warga belajar yang telah memperkenalkan diri."
    });
  };



  if (loading) {
    return <div className="text-center text-slate-500 py-10 animate-pulse">Memuat data pendahuluan...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-black text-[#280f91] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ff6105]" />
              Teks Pembuka Pendahuluan
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Pesan sapaan, penjelasan singkat mengenai RAT, dan instruksi perkenalan untuk warga belajar.
            </p>
          </div>
          <Button 
            onClick={saveTeksPembuka} 
            disabled={saving}
            className="bg-[#280f91] hover:bg-[#ff6105] text-white cursor-pointer transition-colors font-bold gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Teks"}
          </Button>
        </div>
        <RichTextEditor 
          value={teksPembuka} 
          onChange={setTeksPembuka} 
          placeholder="Halo Warga Belajar! Selamat datang di mata pelajaran ini. Silakan perkenalkan diri Anda dan baca RAT serta Tata Tertib di bawah ini..."
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
          <h3 className="text-lg font-black text-[#280f91] mb-2 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#ff6105]" />
            Unggah RAT
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Rancangan Aktivitas Tutorial (RAT).
          </p>

            <div
            onClick={() => ratInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:bg-slate-50 rounded-xl p-10 text-center cursor-pointer transition-all duration-200"
          >
            <input type="file" className="hidden" ref={ratInputRef} accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, "rat")} />
            {ratFile ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-emerald-700 font-bold">{ratFile.title}</p>
                <p className="text-xs text-emerald-600 mt-1">Berhasil diunggah. Klik untuk ganti file.</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Seret & Lepas file di sini</p>
                <p className="text-xs text-slate-400 mt-1">Maksimal: 10MB (.PDF, .DOCX)</p>
                <Button size="sm" className="mt-4 bg-[#280f91] hover:bg-[#ff6105] text-white">
                  Pilih File RAT
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
          <h3 className="text-lg font-black text-[#280f91] mb-2 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#ff6105]" />
            Unggah Tata Tertib
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Tata Tertib pembelajaran sesi ini.
          </p>

          <div
            onClick={() => tertibInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:bg-slate-50 rounded-xl p-10 text-center cursor-pointer transition-all duration-200"
          >
            <input type="file" className="hidden" ref={tertibInputRef} accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, "tertib")} />
            {tertibFile ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-emerald-700 font-bold">{tertibFile.title}</p>
                <p className="text-xs text-emerald-600 mt-1">Berhasil diunggah. Klik untuk ganti file.</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Seret & Lepas file di sini</p>
                <p className="text-xs text-slate-400 mt-1">Maksimal: 10MB (.PDF, .DOCX)</p>
                <Button size="sm" className="mt-4 bg-[#280f91] hover:bg-[#ff6105] text-white">
                  Pilih File Tata Tertib
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-[#280f91] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ff6105]" />
              Forum Perkenalan
            </h3>
            <p className="text-sm text-slate-500 font-medium">Lihat dan balas salam perkenalan dari warga belajar.</p>
          </div>
          <Button onClick={handleMassReply} size="sm" variant="outline" className="border-[#280f91] text-[#280f91] hover:bg-[#280f91] hover:text-white font-bold cursor-pointer">
            Balas Massal
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-8 text-center text-slate-500 border border-slate-100 rounded-xl bg-slate-50/50">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="font-medium">Belum ada warga belajar yang memperkenalkan diri.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
