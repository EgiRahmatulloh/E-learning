import { useState, useEffect } from "react";
import { FileText, Download, Users, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MapelPendahuluanProps {
  subjectName: string;
  user?: any;
}

export function MapelPendahuluan({ subjectName, user }: MapelPendahuluanProps) {
  const [messages, setMessages] = useState<{sender: string; text: string; isSelf: boolean; initial: string; color: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [teksPembuka, setTeksPembuka] = useState("Halo semuanya, selamat datang di mata pelajaran ini.");
  const [ratUrl, setRatUrl] = useState<string | null>(null);
  const [tertibUrl, setTertibUrl] = useState<string | null>(null);

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

        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=0`);
        const sessionData = await sessionRes.json();
        if (!sessionData.success) return;
        
        if (sessionData.data.session.description) {
          setTeksPembuka(sessionData.data.session.description);
        }

        const materials = sessionData.data.materials || [];
        const rat = materials.find((m: any) => m.type === "RAT");
        if (rat) setRatUrl(rat.fileUrl);
        
        const tertib = materials.find((m: any) => m.type === "TATA_TERTIB");
        if (tertib) setTertibUrl(tertib.fileUrl);
        
      } catch (err) {
        console.error("Failed to load pendahuluan data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [subjectName, user]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages([
      ...messages, 
      { sender: "Siswa (Anda)", text: inputValue, isSelf: true, initial: "S", color: "bg-cyan-600" }
    ]);
    setInputValue("");
  };

  const handleDownload = (url: string | null) => {
    if (!url) {
      toast.info("Dokumen belum tersedia", {
        description: "Dokumen belum diunggah oleh tutor saat ini."
      });
      return;
    }
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat materi pendahuluan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* RAT */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="p-3 bg-red-50 rounded-xl">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-800">RAT (Rancangan Aktivitas Tutorial)</h2>
            <p className="text-sm text-slate-500">Panduan belajar selama satu semester (PDF)</p>
          </div>
          <Button variant="outline" onClick={() => handleDownload(ratUrl)} className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4 mr-2" /> Unduh PDF
          </Button>
        </div>
      </div>

      {/* Perkenalan */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-cyan-50 rounded-xl">
            <Users className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Forum Perkenalan</h2>
            <p className="text-sm text-slate-500">Silakan input dan bagikan data diri singkat Anda</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-[#280f91] text-white flex items-center justify-center font-bold text-xs shrink-0">T</div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex-1 prose prose-sm max-w-none prose-slate">
              <p className="text-xs font-bold text-[#280f91] mb-1 not-prose">Tutor</p>
              <div dangerouslySetInnerHTML={{ __html: teksPembuka }} />
            </div>
          </div>
          
          {messages.map((msg, idx) => (
            <div key={idx} className="flex gap-3 mt-4">
              <div className={`h-8 w-8 rounded-full ${msg.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                {msg.initial}
              </div>
              <div className={`p-3 rounded-lg border shadow-sm flex-1 ${msg.isSelf ? 'bg-cyan-50/30 border-cyan-100' : 'bg-white border-slate-200'}`}>
                <p className={`text-xs font-bold mb-1 ${msg.isSelf ? 'text-cyan-700' : 'text-slate-600'}`}>{msg.sender}</p>
                <p className="text-sm text-slate-700">{msg.text}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-4">
             <input 
               type="text" 
               placeholder="Tulis perkenalan Anda di sini..." 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-[#280f91] focus:ring-1 focus:ring-[#280f91]" 
             />
             <Button onClick={handleSendMessage} className="rounded-xl bg-[#280f91] hover:bg-[#3a1bca] text-white font-bold px-6">Kirim</Button>
          </div>
        </div>
      </div>

      {/* Tata Tertib */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <FileSignature className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Tata Tertib Tuton</h2>
            <p className="text-sm text-slate-500">Aturan dan etika mengikuti tutorial online (Docs)</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => handleDownload(tertibUrl)} className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4 mr-2" /> Unduh Dokumen
        </Button>
      </div>

    </div>
  );
}
