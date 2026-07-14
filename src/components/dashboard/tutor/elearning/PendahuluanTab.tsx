import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Users, CheckCircle, FileText, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
// Removed getSubjectsSiswa

interface Props {
  activeTab?: string;
  user?: any;
}

export default function PendahuluanTab({ activeTab, user }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [teksPembuka, setTeksPembuka] = useState("");
  const [ratFile, setRatFile] = useState<{ title: string, url: string } | null>(null);
  const [tertibFile, setTertibFile] = useState<{ title: string, url: string } | null>(null);

  const ratInputRef = useRef<HTMLInputElement>(null);
  const tertibInputRef = useRef<HTMLInputElement>(null);

  const parts = activeTab?.split("-") || [];
  // Format: mapel-setup-{setupId}-{mapelSlug}-pendahuluan
  const setupId = parts[1] === "setup" ? parseInt(parts[2], 10) : null;
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editInputValue, setEditInputValue] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!setupId) return;
      try {
        setLoading(true);

        // Fetch setup details to get actual mapel and kelas
        const setupRes = await fetch(`/api/elearning/setups?tutorId=${user?.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const setupData = await setupRes.json();
        const setup = setupData?.data?.find((s: any) => s.id === setupId);
        if (!setup) throw new Error("Setup E-Learning tidak ditemukan");

        const actualSubject = setup.mapel;
        const actualKelas = setup.kelas;
        const kelasUpper = setup.kelas.toUpperCase();
        const actualProgram = kelasUpper.includes("PAKET A") ? "Paket A" : kelasUpper.includes("PAKET B") ? "Paket B" : "Paket C";

        // 1. Get Course
        const courseRes = await fetch("/api/elearning/course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ subjectName: actualSubject, program: actualProgram, kelas: actualKelas })
        });
        const courseData = await courseRes.json();
        if (!courseData.success) throw new Error(courseData.message);
        setCourseId(courseData.data.id);

        // 2. Get Session 0 (Pendahuluan)
        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=0`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
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

        // 3. Fetch Forum Posts for this session
        fetchForumPosts(sessionData.data.session.id);
      } catch (error: any) {
        toast.error("Gagal memuat data pendahuluan", { description: error.message });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setupId, user]);

  const fetchForumPosts = async (sId: number) => {
    try {
      const res = await fetch(`/api/elearning/forum?sessionId=${sId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setForumPosts(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch forum posts:", err);
    }
  };

  const submitReply = async (parentId?: number) => {
    if (!replyText.trim()) return toast.error("Komentar tidak boleh kosong");
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
        if (sessionId) fetchForumPosts(sessionId);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Gagal mengirim komentar");
    }
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
        if (sessionId) fetchForumPosts(sessionId);
      } else {
        toast.error(data.message || "Gagal mengubah pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengubah pesan");
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pesan ini?")) return;
    try {
      const res = await fetch(`/api/elearning/forum/${msgId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pesan berhasil dihapus");
        if (sessionId) fetchForumPosts(sessionId);
      } else {
        toast.error(data.message || "Gagal menghapus pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus pesan");
    }
  };

  const saveTeksPembuka = async () => {
    if (!sessionId) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/elearning/session/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData
    });
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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
              Pesan sapaan, penjelasan singkat mengenai CP, dan instruksi perkenalan untuk warga belajar.
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
            Unggah CP
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Capaian Pembelajaran (CP).
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
          {forumPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-slate-100 rounded-xl bg-slate-50/50">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-medium">Belum ada warga belajar yang memperkenalkan diri.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {forumPosts.filter(p => !p.parentId).map(post => {
                const isTutorSelf = post.authorId === user?.id && post.authorRole === "tutor";
                const displayName = isTutorSelf ? "Tutor (Anda)" : (post.authorRole === "siswa" ? `Siswa (${post.authorName || 'Unknown'})` : post.authorName);
                const avatarLetter = isTutorSelf ? "T" : (post.authorName || "?").charAt(0).toUpperCase();
                const avatarColorClass = isTutorSelf ? "bg-[#280f91] text-white" : "bg-cyan-100 text-cyan-700";

                return (
                  <div key={post.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColorClass}`}>
                        {avatarLetter}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{displayName}</h4>
                            <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex gap-2">
                            {post.authorId === user?.id && post.authorRole === user?.role && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-slate-400 hover:text-blue-600 px-2"
                                  onClick={() => {
                                    setEditingMessageId(post.id);
                                    setEditInputValue(post.content);
                                  }}
                                  title="Edit pesan"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-slate-400 hover:text-red-600 px-2"
                                  onClick={() => handleDeleteMessage(post.id)}
                                  title="Hapus pesan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-cyan-600 hover:bg-cyan-50"
                              onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                            >
                              Balas
                            </Button>
                          </div>
                        </div>

                        {editingMessageId === post.id ? (
                          <div className="mt-2 space-y-2">
                            <RichTextEditor value={editInputValue} onChange={setEditInputValue} placeholder="Edit pesan..." />
                            <div className="flex gap-2 justify-end">
                              <Button onClick={() => setEditingMessageId(null)} size="sm" variant="outline" className="h-8">Batal</Button>
                              <Button onClick={() => handleEditSubmit(post.id)} size="sm" className="bg-[#280f91] hover:bg-[#3a1bca] text-white h-8">Simpan</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-slate-600 prose" dangerouslySetInnerHTML={{ __html: post.content }} />
                        )}

                        {/* Replies */}
                        {forumPosts.filter(r => r.parentId === post.id).map(reply => {
                          const replyIsTutorSelf = reply.authorId === user?.id && reply.authorRole === "tutor";
                          const replyDisplayName = replyIsTutorSelf ? "Tutor (Anda)" : (reply.authorRole === "siswa" ? `Siswa (${reply.authorName || 'Unknown'})` : reply.authorName);
                          const replyAvatarLetter = replyIsTutorSelf ? "T" : (reply.authorName || "?").charAt(0).toUpperCase();
                          const replyAvatarColorClass = reply.authorRole === 'tutor' ? 'bg-[#280f91] text-white' : 'bg-slate-200 text-slate-600';

                          return (
                            <div key={reply.id} className="mt-3 pl-4 border-l-2 border-slate-200 flex gap-2 group">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${replyAvatarColorClass}`}>
                                {replyAvatarLetter}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                    {replyDisplayName}
                                    {reply.authorRole === 'tutor' && !replyIsTutorSelf && <span className="bg-[#ff6105] text-white px-1.5 py-0.5 rounded text-[9px]">TUTOR</span>}
                                  </h5>
                                  {reply.authorId === user?.id && reply.authorRole === user?.role && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingMessageId(reply.id); setEditInputValue(reply.content); }} className="text-slate-400 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => handleDeleteMessage(reply.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>

                                {editingMessageId === reply.id ? (
                                  <div className="mt-2 space-y-2">
                                    <RichTextEditor value={editInputValue} onChange={setEditInputValue} placeholder="Edit balasan..." />
                                    <div className="flex gap-2 justify-end">
                                      <Button onClick={() => setEditingMessageId(null)} size="sm" variant="outline" className="h-7 text-xs">Batal</Button>
                                      <Button onClick={() => handleEditSubmit(reply.id)} size="sm" className="bg-[#280f91] hover:bg-[#3a1bca] text-white h-7 text-xs">Simpan</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-600 prose mt-1" dangerouslySetInnerHTML={{ __html: reply.content }} />
                                )}
                              </div>
                            </div>
                          );
                        })}

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
                            <Button
                              size="sm"
                              onClick={() => submitReply(post.id)}
                              className="h-9 bg-[#280f91] hover:bg-[#ff6105] text-white"
                            >
                              Kirim
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Pancingan Post Input (At the bottom) */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Buat Topik / Teks Pancingan Baru</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis pancingan diskusi di sini..."
                value={activeReplyId === null ? replyText : ""}
                onChange={(e) => {
                  setActiveReplyId(null);
                  setReplyText(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                className="flex-1 h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-[#280f91]"
              />
              <Button
                onClick={() => submitReply()}
                className="h-10 bg-[#280f91] hover:bg-[#3a1bca] text-white px-6 font-bold"
              >
                Kirim
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
