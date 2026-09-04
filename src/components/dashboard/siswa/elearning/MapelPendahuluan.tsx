import { useState, useEffect } from "react";
import { FileText, Download, Users, FileSignature, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { safeHtml } from "@/lib/sanitize";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface MapelPendahuluanProps {
  subjectName: string;
  user?: any;
  setupId?: number | null;
}

export function MapelPendahuluan({ subjectName, user, setupId }: MapelPendahuluanProps) {
  const [messages, setMessages] = useState<{ id: number; sender: string; text: string; isSelf: boolean; initial: string; color: string; authorFoto?: string | null }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [completions, setCompletions] = useState<Set<string>>(new Set());

  const openFileWithAuth = (url: string) => {
    const token = localStorage.getItem("token") || "";
    const fullUrl = url.includes("?") ? `${url}&token=${token}` : `${url}?token=${token}`;
    window.open(fullUrl, "_blank");
  };

  const fetchCompletions = async () => {
    if (!setupId) return;
    try {
      const res = await fetch(`/api/elearning/completions/${setupId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setCompletions(new Set(data.data.map((c: any) => c.sectionKey)));
      }
    } catch (err) { }
  };

  const handleMarkComplete = async (sectionKey: string) => {
    if (!setupId) return;
    try {
      const res = await fetch("/api/elearning/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ setupId, sectionKey })
      });
      const data = await res.json();
      if (data.success) {
        setCompletions(prev => new Set(prev).add(sectionKey));
      }
    } catch (err) { }
  };

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);

  const [teksPembuka, setTeksPembuka] = useState("Halo semuanya, selamat datang di mata pelajaran ini.");
  const [ratUrl, setRatUrl] = useState<string | null>(null);
  const [tertibUrl, setTertibUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletions();
    async function fetchData() {
      setLoading(true);
      try {
        const courseRes = await fetch("/api/elearning/course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ subjectName, setupId: setupId || undefined })
        });
        const courseData = await courseRes.json();
        if (!courseData.success) return;

        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=0`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const sessionData = await sessionRes.json();
        if (!sessionData.success) return;

        const session = sessionData.data.session;
        setSessionId(session.id);
        setCourseId(courseData.data.id);

        if (session.description) {
          setTeksPembuka(session.description);
        } else {
          setTeksPembuka(""); // will show default fallback later
        }

        const materials = sessionData.data.materials || [];
        const rat = materials.find((m: any) => m.type === "RAT");
        if (rat) setRatUrl(rat.fileUrl);

        const tertib = materials.find((m: any) => m.type === "TATA_TERTIB");
        if (tertib) setTertibUrl(tertib.fileUrl);

        // Fetch forum posts
        const forumRes = await fetch(`/api/elearning/forum?sessionId=${session.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const forumData = await forumRes.json();
        if (forumData.success) {
          const loadedMessages = (Array.isArray(forumData.data) ? forumData.data : []).map((post: any) => {
            const isSelf = post.authorId === user?.id && post.authorRole === user?.role;
            const isTutor = post.authorRole === "tutor";
            const senderName = post.authorName || "Unknown";
            const sender = isTutor ? `Tutor (${senderName})` : isSelf ? "Siswa (Anda)" : `Siswa (${senderName})`;
            const initial = isTutor ? "T" : (isSelf ? "S" : senderName.charAt(0).toUpperCase());
            const color = isTutor ? "bg-[#280f91]" : isSelf ? "bg-cyan-600" : "bg-slate-500";
            return { id: post.id, sender, text: post.content, isSelf, initial, color, authorFoto: post.authorFoto };
          });
          setMessages(loadedMessages);
        }

      } catch (err) {
        console.error("Failed to load pendahuluan data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    handleMarkComplete("pendahuluan_pengantar");
  }, [subjectName, setupId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || !courseId) return;
    try {
      const res = await fetch("/api/elearning/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          sessionId,
          courseId,
          content: inputValue
        })
      });
      const data = await res.json();
      if (data.success) {
        setInputValue("");
        reloadMessages();
        handleMarkComplete("pendahuluan_perkenalan");
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
    }
  };

  const reloadMessages = async () => {
    if (!sessionId) return;
    try {
      const forumRes = await fetch(`/api/elearning/forum?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const forumData = await forumRes.json();
      if (forumData.success) {
        const loadedMessages = (Array.isArray(forumData.data) ? forumData.data : []).map((post: any) => {
          const isSelf = post.authorId === user?.id && post.authorRole === user?.role;
          const isTutor = post.authorRole === "tutor";
          const senderName = post.authorName || "Unknown";
          const sender = isTutor ? `Tutor (${senderName})` : isSelf ? "Siswa (Anda)" : `Siswa (${senderName})`;
          const initial = isTutor ? "T" : (isSelf ? "S" : senderName.charAt(0).toUpperCase());
          const color = isTutor ? "bg-[#280f91]" : isSelf ? "bg-cyan-600" : "bg-slate-500";
          return { id: post.id, sender, text: post.content, isSelf, initial, color, authorFoto: post.authorFoto };
        });
        setMessages(loadedMessages);
      }
    } catch (err) { }
  };

  const handleEditSubmit = async (msgId: number) => {
    if (!editInputValue.trim()) return;
    try {
      const res = await fetch(`/api/elearning/forum/${msgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ content: editInputValue })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pesan berhasil diubah");
        setEditingMessageId(null);
        reloadMessages();
      } else {
        toast.error(data.message || "Gagal mengubah pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengubah pesan");
    }
  };

  const handleDeleteMessage = (msgId: number) => {
    setDeleteConfirmId(msgId);
  };

  const executeDeleteMessage = async () => {
    if (deleteConfirmId === null) return;
    try {
      const res = await fetch(`/api/elearning/forum/${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pesan berhasil dihapus");
        reloadMessages();
      } else {
        toast.error(data.message || "Gagal menghapus pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus pesan");
    } finally {
      setDeleteConfirmId(null);
    }
  };


  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat materi pendahuluan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Teks Pembuka & Berkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Pengantar Mata Pelajaran</h3>
            </div>
          </div>
          {teksPembuka ? (
            <div
              className="text-slate-600 leading-relaxed text-sm prose max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: safeHtml(teksPembuka) }}
            />
          ) : (
            <p className="text-slate-400 italic text-sm">Tutor belum menambahkan teks pengantar.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm p-5 hover:shadow-md transition duration-300 group">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-white p-2 rounded-xl shadow-sm group-hover:scale-110 transition">
                <FileSignature className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex gap-2 items-center">
                {ratUrl && (
                  <Button
                    onClick={() => {
                      handleMarkComplete("pendahuluan_rat");
                      openFileWithAuth(ratUrl);
                    }}
                    size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-emerald-600 hover:bg-emerald-100">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <SectionCompleteButton sectionKey="pendahuluan_rat" completions={completions} handleMarkComplete={handleMarkComplete} className="m-0 h-8 text-xs px-3" />
              </div>
            </div>
            <h4 className="font-bold text-emerald-900 mb-1">Capaian Pembelajaran (CP)</h4>
            <p className="text-xs text-emerald-700/80 mb-3 line-clamp-2">Dokumen panduan aktivitas tutorial selama satu semester.</p>
            {ratUrl ? (
              <Button onClick={() => { handleMarkComplete("pendahuluan_rat"); openFileWithAuth(ratUrl); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold rounded-xl text-xs h-9">
                Unduh Dokumen
              </Button>
            ) : (
              <Button disabled className="w-full bg-emerald-200 text-emerald-700 font-semibold rounded-xl text-xs h-9">
                Belum Diunggah
              </Button>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-sm p-5 hover:shadow-md transition duration-300 group">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-white p-2 rounded-xl shadow-sm group-hover:scale-110 transition">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex gap-2 items-center">
                {tertibUrl && (
                  <Button onClick={() => { handleMarkComplete("pendahuluan_tertib"); openFileWithAuth(tertibUrl); }} size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-amber-600 hover:bg-amber-100">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <SectionCompleteButton sectionKey="pendahuluan_tertib" completions={completions} handleMarkComplete={handleMarkComplete} className="m-0 h-8 text-xs px-3" />
              </div>
            </div>
            <h4 className="font-bold text-amber-900 mb-1">Tata Tertib</h4>
            <p className="text-xs text-amber-700/80 mb-3 line-clamp-2">Peraturan yang harus ditaati selama mengikuti pembelajaran.</p>
            {tertibUrl ? (
              <Button onClick={() => { handleMarkComplete("pendahuluan_tertib"); openFileWithAuth(tertibUrl); }} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold rounded-xl text-xs h-9">
                Unduh Tata Tertib
              </Button>
            ) : (
              <Button disabled className="w-full bg-amber-200 text-amber-700 font-semibold rounded-xl text-xs h-9">
                Belum Diunggah
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Perkenalan */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-50 rounded-xl">
              <Users className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Forum Perkenalan</h2>
              <p className="text-sm text-slate-500">Silakan input dan bagikan data diri singkat Anda</p>
            </div>
          </div>
          <SectionCompleteButton sectionKey="pendahuluan_perkenalan" completions={completions} handleMarkComplete={handleMarkComplete} className="m-0" />
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">

          {messages.length === 0 && (
            <p className="text-center text-slate-400 text-sm italic py-4">Belum ada perkenalan. Jadilah yang pertama menyapa!</p>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 mt-4">
              {msg.authorFoto ? (
                <img src={msg.authorFoto} alt={msg.sender} className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200" />
              ) : (
                <div className={`h-8 w-8 rounded-full ${msg.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                  {msg.initial}
                </div>
              )}
              <div className={`p-3 rounded-lg border shadow-sm flex-1 ${msg.isSelf ? 'bg-cyan-50/30 border-cyan-100' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className={`text-xs font-bold ${msg.isSelf ? 'text-cyan-700' : 'text-slate-600'}`}>{msg.sender}</p>
                  {msg.isSelf && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditInputValue(new DOMParser().parseFromString(msg.text, "text/html").body.textContent || '');
                        }}
                        className="text-slate-400 hover:text-cyan-600 transition-colors"
                        title="Edit pesan"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus pesan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <textarea
                      value={editInputValue}
                      onChange={(e) => setEditInputValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[80px] resize-y"
                      placeholder="Edit perkenalan..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => setEditingMessageId(null)} size="sm" variant="ghost" className="h-8">Batal</Button>
                      <Button onClick={() => handleEditSubmit(msg.id)} size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-8">Simpan</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml(msg.text) }} />
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-700">Perkenalkan diri Anda</h4>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tulis perkenalan Anda di sini..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#280f91] focus:outline-none focus:ring-1 focus:ring-[#280f91] min-h-[50px] resize-y"
            />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage} className="rounded-xl bg-[#280f91] hover:bg-[#3a1bca] text-white font-bold px-6">Kirim</Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onConfirm={executeDeleteMessage}
        onCancel={() => setDeleteConfirmId(null)}
        title="Hapus Pesan"
        description="Apakah Anda yakin ingin menghapus pesan ini? Aksi ini tidak dapat dibatalkan."
      />
    </div>
  );
}

function SectionCompleteButton({ sectionKey, completions, handleMarkComplete, className = "" }: { sectionKey: string, completions: Set<string>, handleMarkComplete: (key: string) => void, className?: string }) {
  const isDone = completions.has(sectionKey);
  return (
    <Button
      size="sm"
      onClick={() => !isDone && handleMarkComplete(sectionKey)}
      disabled={isDone}
      className={`font-bold ${isDone ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-not-allowed border-emerald-200"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
        } border ${className || 'mt-4 w-full sm:w-auto'}`}
    >
      {isDone ? (
        <><CheckCircle2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Selesai</span></>
      ) : (
        <><CheckCircle2 className="w-4 h-4 sm:hidden" /> <span className="hidden sm:inline">Tandai Selesai</span></>
      )}
    </Button>
  );
}
