import { useState, useEffect, useRef } from "react";
import { FileText, PlayCircle, PenTool, CheckCircle2, Download, MessageCircle, X, Pencil, Trash2, Upload, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { safeHtml } from "@/lib/sanitize";
import { commitUploads, discardUpload, uploadFile } from "@/lib/upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface MapelSesiProps {
  subjectName: string;
  sessionNumber: number;
  user?: any;
  setupId?: number | null;
  onAngketCompleted?: (sessionNumber: number) => void;
}

export function MapelSesi({ subjectName, sessionNumber, user, setupId, onAngketCompleted }: MapelSesiProps) {


  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionInput, setDiscussionInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [cancelTaskConfirmId, setCancelTaskConfirmId] = useState<number | null>(null);

  const openFileWithAuth = (url: string) => {
    const token = localStorage.getItem("token") || "";
    const fullUrl = url.includes("?") ? `${url}&token=${token}` : `${url}?token=${token}`;
    window.open(fullUrl, "_blank");
  };

  const [isHadir, setIsHadir] = useState(false);
  const [loading, setLoading] = useState(true);

  const [teksPembuka, setTeksPembuka] = useState("");
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState("");
  const [uraianKegiatan, setUraianKegiatan] = useState("");
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tugasUrl, setTugasUrl] = useState<string | null>(null);
  const [batasKirim, setBatasKirim] = useState<string | null>(null);
  const [showAngket, setShowAngket] = useState(false);
  const [angketQuestions, setAngketQuestions] = useState<any[]>([]);
  const [angketCompleted, setAngketCompleted] = useState(false);
  const [angketAnswers, setAngketAnswers] = useState<Record<number, string>>({});
  const tugasUploadRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [showLatihan, setShowLatihan] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizGrade, setQuizGrade] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const [isLatihanLoading, setIsLatihanLoading] = useState(false);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [submissionData, setSubmissionData] = useState<any>(null);

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
        setCompletions(prev => new Set([...prev, sectionKey]));
        // toast.success("Bagian ini telah ditandai selesai!");
      }
    } catch (err) { }
  };

  const loadQuestions = async (sid?: number) => {
    const activeSessionId = sid || sessionId;
    if (!activeSessionId || !user?.id) return;
    setIsLatihanLoading(true);
    setQuizGrade(null);
    setQuestions([]);
    setAnswers([]);

    try {
      const res = await fetch(`/api/elearning/quiz/${activeSessionId}?studentId=${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data.questions.map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        })));
        
        if (data.data.submission) {
          setQuizGrade(data.data.submission.grade);
          setCorrectCount(data.data.submission.correctCount ?? null);
          const savedAns = data.data.submission.answers;
          const parsed = typeof savedAns === 'string' ? JSON.parse(savedAns) : savedAns;
          if (Array.isArray(parsed) && parsed.length === data.data.questions.length) {
            setAnswers(parsed);
          } else {
            // Cache mismatch (questions changed since submit) — discard saved answers
            setAnswers(new Array(data.data.questions.length).fill(-1));
          }
        } else {
          setQuizGrade(null);
          setAnswers(new Array(data.data.questions.length).fill(-1));
        }
      }
    } catch (err) { }
    setIsLatihanLoading(false);
  };

  useEffect(() => {
    fetchCompletions();
    async function fetchData() {
      setLoading(true);
      setIsHadir(false);
      setQuizGrade(null);
      setCorrectCount(null);
      setAnswers([]);
      setQuestions([]);
      setShowLatihan(false);
      setAngketAnswers({});

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

        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseData.data.id}&sessionNumber=${sessionNumber}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const sessionData = await sessionRes.json();
        if (!sessionData.success) return;
        const session = sessionData.data.session;
        setSessionId(session.id);
        setCourseId(courseData.data.id);
        loadQuestions(session.id);

        if (session.description) {
          setTeksPembuka(session.description);
        } else {
          setTeksPembuka("");
        }
        setTujuanPembelajaran(session.tujuanPembelajaran || "");
        setUraianKegiatan(session.uraianKegiatan || "");

        if (session.endDate) {
          setBatasKirim(session.endDate);
        } else {
          setBatasKirim(null);
        }

        const materials = Array.isArray(sessionData.data.materials) ? sessionData.data.materials : [];
        const ppt = materials.find((m: any) => m.type === "PPT");
        if (ppt) setPptUrl(ppt.fileUrl);
        else setPptUrl(null);

        const video = materials.find((m: any) => m.type === "VIDEO");
        if (video) setVideoUrl(video.fileUrl);
        else setVideoUrl(null);

        // Fetch Angket status & questions
        const angketStatusRes = await fetch(`/api/elearning/session-angket?sessionId=${session.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const angketStatusData = await angketStatusRes.json();
        if (angketStatusData.success) {
          setAngketCompleted(angketStatusData.completed);
        }

        const angketQRes = await fetch(`/api/elearning/evaluations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const angketQData = await angketQRes.json();
        if (angketQData.success && Array.isArray(angketQData.data)) {
          setAngketQuestions(angketQData.data);
        }

        // Fetch forum posts tugas = materials.find((m: any) => m.type === "TUGAS");
        const tugas = materials.find((m: any) => m.type === "TUGAS");
        if (tugas) setTugasUrl(tugas.fileUrl);
        else setTugasUrl(null);



        if (user?.id) {
          const attRes = await fetch(`/api/elearning/attendance?sessionId=${session.id}&studentId=${user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          const attData = await attRes.json();
          if (attData.success && attData.data) {
            setIsHadir(true);
          }
        }

        const forumRes = await fetch(`/api/elearning/forum?sessionId=${session.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const forumData = await forumRes.json();
        if (forumData.success) {
          setDiscussions(Array.isArray(forumData.data) ? forumData.data : []);
        }

        if (user?.id) {
          const subRes = await fetch(`/api/elearning/submissions/${session.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          const subData = await subRes.json();
          if (subData.success && Array.isArray(subData.data)) {
            const mySub = subData.data.find((s: any) => s.studentId === user.id);
            setSubmissionData(mySub || null);
          }
        }

      } catch (err) { }
      finally {
        setLoading(false);
      }
    }
    fetchData();
    handleMarkComplete(`sesi_${sessionNumber}_pengantar`);
  }, [subjectName, sessionNumber, setupId]);

  useEffect(() => {
    if (angketCompleted) {
      // Eagerly notify parent with the session that was just completed
      // so navigation unlock is instant (no waiting for fetch round-trip)
      onAngketCompleted?.(sessionNumber);
    }
  }, [angketCompleted, onAngketCompleted, sessionNumber]);

  const handleSendDiscussion = async () => {
    if (!discussionInput.trim() || !sessionId || !courseId) return;
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
          content: discussionInput
        })
      });
      const data = await res.json();
      if (data.success) {
        reloadDiscussions();
        handleMarkComplete(`sesi_${sessionNumber}_diskusi`);
        setDiscussionInput("");
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan diskusi");
    }
  };

  const reloadDiscussions = async () => {
    if (!sessionId) return;
    try {
      const forumRes = await fetch(`/api/elearning/forum?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const forumData = await forumRes.json();
      if (forumData.success) {
        setDiscussions(Array.isArray(forumData.data) ? forumData.data : []);
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
        reloadDiscussions();
      } else {
        toast.error(data.message || "Gagal mengubah pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengubah pesan");
    }
  };

  const submitReply = async (parentId: number) => {
    if (!replyText.trim() || !sessionId || !courseId) return;
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
          content: replyText,
          parentId
        })
      });
      const data = await res.json();
      if (data.success) {
        setDiscussionInput("");
        setReplyText("");
        setActiveReplyId(null);
        handleMarkComplete(`sesi_${sessionNumber}_diskusi`);
        toast.success("Diskusi berhasil dikirim!");
        reloadDiscussions();
      } else {
        toast.error("Gagal mengirim balasan");
      }
    } catch (err) {
      toast.error("Gagal mengirim balasan");
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
        reloadDiscussions();
      } else {
        toast.error(data.message || "Gagal menghapus pesan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus pesan");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDownload = (url: string | null) => {
    if (!url) {
      toast.info("Belum tersedia", {
        description: "Materi belum diunggah oleh tutor saat ini."
      });
      return;
    }
    openFileWithAuth(url);
  };

  const handleKehadiran = async () => {
    if (!sessionId || !user?.id) return;
    try {
      const res = await fetch("/api/elearning/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ sessionId, studentId: Number(user.id) })
      });
      const data = await res.json();
      if (data.success) {
        setIsHadir(true);
        handleMarkComplete(`sesi_${sessionNumber}_kehadiran`);
        toast.success("Kehadiran berhasil dicatat!");
      }
    } catch (err) {
      toast.error("Gagal mengonfirmasi kehadiran");
    }
  };

  const handleUploadJawaban = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !sessionId) return;
    if (!user?.id) {
      toast.error("Gagal: User belum login");
      return;
    }
    const file = e.target.files[0];
    const toastId = toast.loading(`Mengunggah jawaban: ${file.name}...`);
    let fileUrl = "";
    try {
      fileUrl = await uploadFile(file);

      const res = await fetch(`/api/elearning/submissions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ studentId: user?.id, fileUrl })
      });
      const data = await res.json();

      if (data.success) {
        // Berkas kumpulan sebelumnnya dilepas server saat submission ditimpa
        commitUploads(fileUrl);
        toast.success("Tugas berhasil diunggah!", { id: toastId });
        handleMarkComplete(`sesi_${sessionNumber}_tugas`);
      } else {
        // Berkas sudah masuk storage tapi digagalkan server — buang unggahannya
        void discardUpload(fileUrl);
        toast.error(data.message, { id: toastId });
      }
    } catch (err: any) {
      void discardUpload(fileUrl);
      toast.error("Gagal mengunggah jawaban", { description: err.message, id: toastId });
    }
  };

  const executeCancelTask = async () => {
    if (cancelTaskConfirmId === null) return;
    
    const toastId = toast.loading("Membatalkan tugas...");
    try {
      const res = await fetch(`/api/elearning/submissions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ studentId: user?.id, fileUrl: "" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pengiriman tugas berhasil dibatalkan", { id: toastId });
        setSubmissionData(null);
        const newComps = new Set(completions);
        newComps.delete(`sesi_${sessionNumber}_tugas`);
        setCompletions(newComps);
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (err: any) {
      toast.error("Gagal membatalkan tugas", { description: err.message, id: toastId });
    } finally {
      setCancelTaskConfirmId(null);
    }
  };


  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse">Memuat data sesi...</div>;
  }

  return (
    <div className="space-y-6">


      {/* Selesai Button Helper Component */}
      <>
        {/* Kehadiran */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-black text-slate-800">Kehadiran Sesi {sessionNumber}</h2>
              <p className="text-sm text-slate-500">
                {isHadir ? "Anda sudah mengonfirmasi kehadiran untuk sesi ini." : "Klik tombol di samping untuk konfirmasi kehadiran"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Button
              onClick={handleKehadiran}
              disabled={isHadir}
              className={`flex-1 sm:flex-none font-bold rounded-xl px-6 ${isHadir
                ? "bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 shadow-lg"
                }`}
            >
              {isHadir ? "Sudah Hadir" : "Konfirmasi Hadir"}
            </Button>
            <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_kehadiran`} className="m-0 shrink-0" />
          </div>
        </div>

        {/* Teks Pembuka / Materi yang diajarkan Sesi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 prose prose-sm max-w-none prose-slate relative">
          <div className="flex items-center justify-between not-prose mb-3">
            <h3 className="font-bold text-[#280f91]">Materi yang diajarkan Sesi {sessionNumber}</h3>
          </div>
          {teksPembuka ? (
            <div className="break-words" dangerouslySetInnerHTML={{ __html: safeHtml(teksPembuka) }} />
          ) : (
            <p className="text-slate-500 italic">Tutor belum menambahkan materi yang diajarkan untuk sesi ini.</p>
          )}
        </div>

        {/* Tujuan Pembelajaran Sesi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 prose prose-sm max-w-none prose-slate relative">
          <div className="flex items-center justify-between not-prose mb-3">
            <h3 className="font-bold text-[#280f91]">Tujuan Pembelajaran Sesi {sessionNumber}</h3>
          </div>
          {tujuanPembelajaran ? (
            <div className="break-words" dangerouslySetInnerHTML={{ __html: safeHtml(tujuanPembelajaran) }} />
          ) : (
            <p className="text-slate-500 italic">Tutor belum menambahkan tujuan pembelajaran untuk sesi ini.</p>
          )}
        </div>

        {/* Uraian Kegiatan Pembelajaran Sesi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 prose prose-sm max-w-none prose-slate relative">
          <div className="flex items-center justify-between not-prose mb-3">
            <h3 className="font-bold text-[#280f91]">Uraian Kegiatan Pembelajaran Sesi {sessionNumber}</h3>
          </div>
          {uraianKegiatan ? (
            <div className="break-words" dangerouslySetInnerHTML={{ __html: safeHtml(uraianKegiatan) }} />
          ) : (
            <p className="text-slate-500 italic">Tutor belum menambahkan uraian kegiatan pembelajaran untuk sesi ini.</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Materi Inisiasi */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 flex flex-col relative">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <FileText className="h-5 w-5 text-[#280f91]" />
              <h3 className="font-bold text-slate-700 flex-1">Materi Inisiasi Sesi {sessionNumber}</h3>
              <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_inisiasi`} className="m-0" />
            </div>
            <div className="flex-1 min-h-[160px] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-6 text-center flex-col gap-4">
              {pptUrl ? (
                <>
                  <FileText className="h-12 w-12 text-[#280f91] opacity-50" />
                  <Button onClick={() => { handleMarkComplete(`sesi_${sessionNumber}_inisiasi`); handleDownload(pptUrl); }} variant="outline" className="rounded-xl border-slate-200 font-bold text-slate-700">
                    <Download className="w-4 h-4 mr-2" /> Unduh Materi PPT/PDF
                  </Button>
                </>
              ) : (
                <p className="text-sm font-semibold text-slate-400">Materi inisiasi belum diunggah</p>
              )}
            </div>
          </div>

          {/* Materi Pengayaan */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 flex flex-col relative">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <PlayCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-slate-700 flex-1">Materi Pengayaan Sesi {sessionNumber}</h3>
              <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_pengayaan`} className="m-0" />
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-6 text-center flex-col gap-4">
              {videoUrl ? (
                <>
                  <PlayCircle className="h-12 w-12 text-red-500 opacity-50 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">
                    Silakan tonton video pengayaan berikut:
                  </p>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleMarkComplete(`sesi_${sessionNumber}_pengayaan`)}
                    className="text-[#280f91] underline font-bold hover:text-[#ff6105] transition-colors break-all"
                  >
                    {videoUrl}
                  </a>
                </>
              ) : (
                <div className="text-center p-6">
                  <PlayCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-bold">Materi pengayaan belum diunggah</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diskusi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 relative">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-700 flex-1">Forum Diskusi Sesi {sessionNumber}</h3>
            <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_diskusi`} className="m-0" />
          </div>
          <div className="space-y-4 my-4 max-h-96 overflow-y-auto pr-2">
            {discussions.length === 0 && (
              <p className="text-center text-slate-400 text-sm italic py-4">Belum ada diskusi. Jadilah yang pertama menyapa!</p>
            )}
            {discussions.filter(d => !d.parentId).map((msg) => {
              const renderReplies = (parentId: number, depth: number = 0) => {
                const replies = discussions.filter(r => r.parentId === parentId);
                if (replies.length === 0) return null;

                return replies.map(reply => {
                  const replyIsSelf = reply.authorId === user?.id && reply.authorRole === user?.role;
                  const replyIsTutor = reply.authorRole === "tutor";
                  const replySenderName = reply.authorName || "Unknown";
                  const replyDisplayName = replyIsTutor ? `Tutor (${replySenderName})` : replyIsSelf ? "Siswa (Anda)" : `Siswa (${replySenderName})`;
                  const replyInitial = replyIsTutor ? "T" : (replyIsSelf ? "S" : replySenderName.charAt(0).toUpperCase());
                  const replyColor = replyIsTutor ? "bg-[#280f91]" : replyIsSelf ? "bg-blue-600" : "bg-slate-500";
                  const maxDepth = 4; // visual indent limit
                  const visualDepth = depth > maxDepth ? maxDepth : depth;

                  return (
                    <div key={reply.id} className={`mt-3 border-l-2 border-slate-200 flex gap-2 group ${visualDepth > 0 ? 'pl-2 sm:pl-4' : 'pl-4'}`}>
                      {reply.authorFoto ? (
                        <img src={reply.authorFoto} alt={replyDisplayName} className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${replyColor}`}>
                          {replyInitial}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                            {replyDisplayName}
                          </h5>
                          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {replyIsSelf && (
                              <>
                                <button onClick={() => { setEditingMessageId(reply.id); setEditInputValue(new DOMParser().parseFromString(reply.content, "text/html").body.textContent || ''); }} className="text-slate-400 hover:text-blue-600" title="Edit pesan"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteMessage(reply.id)} className="text-slate-400 hover:text-red-600" title="Hapus pesan"><Trash2 className="w-3 h-3" /></button>
                              </>
                            )}
                            {!replyIsSelf && (
                              <button onClick={() => setActiveReplyId(activeReplyId === reply.id ? null : reply.id)} className="text-xs text-blue-600 hover:underline">Balas</button>
                            )}
                          </div>
                        </div>

                        {editingMessageId === reply.id ? (
                          <div className="mt-2 space-y-2 w-full">
                            <RichTextEditor
                              value={editInputValue}
                              onChange={setEditInputValue}
                              placeholder="Edit pesan..."
                            />
                            <div className="flex gap-2 justify-end">
                              <Button onClick={() => setEditingMessageId(null)} size="sm" variant="outline" className="h-7 text-xs">Batal</Button>
                              <Button onClick={() => handleEditSubmit(reply.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">Simpan</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600 prose mt-1 max-w-none break-words" dangerouslySetInnerHTML={{ __html: safeHtml(reply.content) }} />
                        )}

                        {activeReplyId === reply.id && (
                          <div className="mt-4 flex flex-col gap-2 w-full pr-2">
                            <RichTextEditor
                              value={replyText}
                              onChange={setReplyText}
                              placeholder="Ketik balasan Anda..."
                              className="min-h-[80px]"
                            />
                            <div className="flex justify-end">
                              <Button size="sm" onClick={() => submitReply(reply.id)} className="h-8 bg-blue-600 hover:bg-blue-700 text-white px-3 text-xs">Kirim Balasan</Button>
                            </div>
                          </div>
                        )}

                        {renderReplies(reply.id, depth + 1)}
                      </div>
                    </div>
                  );
                });
              };

              const isSelf = msg.authorId === user?.id && msg.authorRole === user?.role;
              const isTutor = msg.authorRole === "tutor";
              const senderName = msg.authorName || "Unknown";
              const displayName = isTutor ? `Tutor (${senderName})` : isSelf ? "Siswa (Anda)" : `Siswa (${senderName})`;
              const initial = isTutor ? "T" : (isSelf ? "S" : senderName.charAt(0).toUpperCase());
              const color = isTutor ? "bg-[#280f91]" : isSelf ? "bg-blue-600" : "bg-slate-500";

              return (
                <div key={msg.id} className="flex gap-3">
                  {msg.authorFoto ? (
                    <img src={msg.authorFoto} alt={displayName} className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200" />
                  ) : (
                    <div className={`h-8 w-8 rounded-full ${color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                      {initial}
                    </div>
                  )}
                  <div className={`p-3 rounded-lg border shadow-sm flex-1 min-w-0 ${isSelf ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                      <p className={`text-xs font-bold flex items-center gap-2 ${isSelf ? 'text-blue-700' : 'text-slate-600'}`}>
                        {displayName}
                      </p>
                      <div className="flex gap-2">
                        {isSelf && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditInputValue(new DOMParser().parseFromString(msg.content, "text/html").body.textContent || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
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
                          </>
                        )}
                        {!isSelf && (
                          <button onClick={() => setActiveReplyId(activeReplyId === msg.id ? null : msg.id)} className="text-xs text-blue-600 hover:underline">Balas</button>
                        )}
                      </div>
                    </div>
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 mt-2 w-full">
                        <RichTextEditor
                          value={editInputValue}
                          onChange={setEditInputValue}
                          placeholder="Edit pesan..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => setEditingMessageId(null)} size="sm" variant="outline" className="h-8">Batal</Button>
                          <Button onClick={() => handleEditSubmit(msg.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8">Simpan</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 prose max-w-none mt-1 break-words" dangerouslySetInnerHTML={{ __html: safeHtml(msg.content) }} />
                    )}

                    {activeReplyId === msg.id && (
                      <div className="mt-4 flex flex-col gap-2 w-full">
                        <RichTextEditor
                          value={replyText}
                          onChange={setReplyText}
                          placeholder="Ketik balasan Anda..."
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => submitReply(msg.id)} className="h-8 bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs">Kirim Balasan</Button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies */}
                    {renderReplies(msg.id)}

                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-4">
            <h4 className="text-sm font-bold text-slate-700">Tulis Tanggapan Baru</h4>
            <RichTextEditor
              value={discussionInput}
              onChange={setDiscussionInput}
              placeholder="Tulis tanggapan Anda..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSendDiscussion} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">Kirim</Button>
            </div>
          </div>
        </div>

        {/* Latihan */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="p-3 bg-purple-50 rounded-xl shrink-0">
              <PenTool className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-black text-slate-800">Latihan Sesi {sessionNumber}</h2>
              <p className="text-sm text-slate-500">Uji pemahaman mandiri (Soal Pilihan Ganda)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Button onClick={() => { setShowLatihan(true); loadQuestions(); }} variant="outline" className="flex-1 sm:flex-none rounded-xl border-purple-200 text-purple-700 font-bold hover:bg-purple-50">
              {quizGrade !== null ? "Lihat Hasil Latihan" : "Mulai Latihan"}
            </Button>
            <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_latihan`} className="m-0 shrink-0" />
          </div>
        </div>

        {/* Tugas Khusus */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4 relative">
          <div className="flex items-center gap-3 border-b border-orange-200 pb-3">
            <Upload className="h-6 w-6 text-orange-600" />
            <div className="flex-1">
              <h2 className="text-lg font-black text-orange-900">Tugas Sesi {sessionNumber}</h2>
              <p className="text-xs text-orange-700">Unduh soal dan kumpulkan jawaban tugas di sini.</p>
              <p className="text-xs font-bold mt-1 text-rose-600">
                Batas Kirim Jawaban: {batasKirim ? new Date(batasKirim).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : "Belum ditentukan"}
              </p>
            </div>
            <SectionCompleteButton completions={completions} handleMarkComplete={handleMarkComplete} sectionKey={`sesi_${sessionNumber}_tugas`} className="m-0" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Button onClick={() => handleDownload(tugasUrl)} variant="outline" className="flex-1 bg-white hover:bg-orange-50 border-orange-200 text-orange-700 font-bold h-12 min-w-[200px]">
              Unduh Soal Tugas
            </Button>
            <input
              type="file"
              className="hidden"
              ref={tugasUploadRef}
              accept=".pdf,.docx,.doc"
              onChange={handleUploadJawaban}
            />
            <Button 
              onClick={() => tugasUploadRef.current?.click()} 
              className={`flex-1 font-bold h-12 min-w-[200px] ${submissionData && submissionData.fileUrl ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
            >
              {submissionData && submissionData.fileUrl ? 'Tugas Terkirim (Unggah Ulang)' : 'Kirim Jawaban'}
            </Button>
            {submissionData && submissionData.fileUrl && (
              <Button 
                onClick={() => setCancelTaskConfirmId(submissionData.id)} 
                variant="outline" 
                className="flex-1 h-12 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 font-bold min-w-[200px]"
              >
                Batalkan Pengiriman
              </Button>
            )}
          </div>
        </div>

        {/* Evaluasi Khusus (Semua Sesi) */}
        {!angketCompleted && (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <HelpCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-rose-900">Evaluasi Kinerja Tutor Sesi {sessionNumber}</h2>
                <p className="text-sm text-rose-700">Wajib diisi: Angket penilaian untuk tutor pada sesi ini sebelum melanjutkan.</p>
              </div>
            </div>
            <Button onClick={() => setShowAngket(true)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold w-full sm:w-auto">
              Isi Angket
            </Button>
          </div>
        )}
      </>

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
                <div key={q.id !== undefined && q.id !== null ? `q-${q.id}` : `idx-${idx}`} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-4">{idx + 1}. {q.question}</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                    {["Sangat Kurang", "Kurang", "Cukup", "Baik", "Sangat Baik"].map((label, i) => (
                      <label key={i} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          checked={angketAnswers[q.id] === label}
                          onChange={() => setAngketAnswers(prev => ({ ...prev, [q.id]: label }))}
                          className="w-5 h-5 sm:w-4 sm:h-4 text-rose-600 accent-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-sm sm:text-[10px] md:text-xs font-bold text-slate-600 group-hover:text-rose-600 text-left sm:text-center leading-tight">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  onClick={async () => {
                    if (angketQuestions.length === 0) {
                      return toast.error("Belum ada pertanyaan angket yang tersedia.");
                    }
                    if (Object.keys(angketAnswers).length < angketQuestions.length) {
                      return toast.error("Harap jawab semua pertanyaan angket.");
                    }
                    const toastId = toast.loading("Mengirim angket...");
                    try {
                      const labelToScore: Record<string, number> = {
                        "Sangat Kurang": 1,
                        "Kurang": 2,
                        "Cukup": 3,
                        "Baik": 4,
                        "Sangat Baik": 5
                      };
                      const responses = Object.keys(angketAnswers).map(qid => ({
                        evaluationId: Number(qid),
                        score: labelToScore[angketAnswers[Number(qid)]] || 5
                      }));
                      const res = await fetch("/api/elearning/session-angket", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify({ sessionId, responses })
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Terima kasih! Angket berhasil dikirimkan.", { id: toastId });
                        setAngketCompleted(true);
                        setShowAngket(false);
                      } else {
                        toast.error(data.message || "Gagal mengirim angket", { id: toastId });
                      }
                    } catch (err) {
                      toast.error("Terjadi kesalahan", { id: toastId });
                    }
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

      {/* Modal Latihan Sesi */}
      {showLatihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <PenTool className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-black text-purple-950 text-lg">Latihan Mandiri Sesi {sessionNumber}</h3>
                  <p className="text-xs font-semibold text-purple-600/80">Kuis Pilihan Ganda</p>
                </div>
              </div>
              <button onClick={() => setShowLatihan(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {isLatihanLoading ? (
                <p className="text-center text-slate-500 font-bold py-10">Memuat soal kuis...</p>
              ) : questions.length === 0 ? (
                <div className="p-10 space-y-6 flex flex-col items-center text-center bg-slate-50/50 rounded-2xl">
                  <PenTool className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-lg">Belum Ada Soal</p>
                  <p className="text-slate-500 text-sm max-w-sm">Tutor belum menambahkan soal latihan untuk sesi ini. Silakan periksa kembali nanti.</p>
                  <Button onClick={() => setShowLatihan(false)} variant="outline" className="mt-4 font-bold">Kembali</Button>
                </div>
              ) : quizGrade !== null ? (
                <div className="space-y-6">
                  <div className="p-8 space-y-4 flex flex-col items-center text-center bg-purple-50/50 rounded-2xl border border-purple-100">
                    <CheckCircle2 className="w-16 h-16 text-purple-500 mb-2" />
                    <p className="font-black text-slate-800 text-2xl">Latihan Selesai</p>
                    <p className="text-slate-600 text-sm">
                      Hasil latihan mandiri Anda: <span className="font-bold text-emerald-600">Benar {correctCount ?? Math.round((quizGrade * questions.length) / 100)}</span> | <span className="font-bold text-red-600">Salah {questions.length - (correctCount ?? Math.round((quizGrade * questions.length) / 100))}</span>
                    </p>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                      <div key={qIdx} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
                        <h4 className="font-bold text-slate-800 text-base leading-snug">{qIdx + 1}. {q.question}</h4>
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isSelected = answers[qIdx] === optIdx;
                            const isCorrect = Number(q.correctAnswer) === optIdx;
                            let labelClass = "bg-slate-50 border-slate-200";

                            if (isCorrect && isSelected) {
                              labelClass = "bg-emerald-50 border-emerald-300";
                            } else if (isSelected && !isCorrect) {
                              labelClass = "bg-red-50 border-red-300";
                            } else if (isCorrect && !isSelected) {
                              labelClass = "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20";
                            }

                            return (
                              <label key={optIdx} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${labelClass} opacity-90`}>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    disabled
                                    checked={isSelected}
                                    className="w-5 h-5"
                                  />
                                  <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : isSelected ? "text-red-700" : "text-slate-700"}`}>{opt}</span>
                                </div>
                                {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-base leading-snug">{qIdx + 1}. {q.question}</h4>
                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${answers[qIdx] === optIdx ? "bg-purple-50 border-purple-300" : "bg-slate-50 border-slate-200 hover:border-purple-200"}`}>
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={answers[qIdx] === optIdx}
                              onChange={() => {
                                const newAns = [...answers];
                                newAns[qIdx] = optIdx;
                                setAnswers(newAns);
                              }}
                              className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-300"
                            />
                            <span className="text-sm font-semibold text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isLatihanLoading && questions.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3 shrink-0 z-10 sticky bottom-0">
                {quizGrade === null ? (
                  <>
                    <Button variant="outline" onClick={() => setShowLatihan(false)} className="font-bold">Batal</Button>
                    <Button

                      onClick={async () => {
                        if (answers.includes(-1)) return toast.error("Harap jawab semua pertanyaan!");
                        const toastId = toast.loading("Mengirim jawaban...");
                        try {
                          const res = await fetch(`/api/elearning/quiz/${sessionId}/submit`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${localStorage.getItem("token")}`
                            },
                            body: JSON.stringify({ answers })
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast.success(data.message, { id: toastId });
                            localStorage.setItem(`quiz_answers_${sessionId}_${user.id}`, JSON.stringify(answers));
                            setQuizGrade(data.grade);
                            setCorrectCount(data.correctCount ?? null);
                            handleMarkComplete(`sesi_${sessionNumber}_latihan`);
                          } else {
                            toast.error(data.message, { id: toastId });
                          }
                        } catch (err: any) {
                          toast.error("Gagal mengirim jawaban", { id: toastId });
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6"
                    >
                      Kirim Jawaban
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowLatihan(false)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8">Tutup</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Forum */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onConfirm={executeDeleteMessage}
        onCancel={() => setDeleteConfirmId(null)}
        title="Hapus Pesan"
        description="Apakah Anda yakin ingin menghapus pesan ini? Aksi ini tidak dapat dibatalkan."
      />

      <ConfirmDialog
        open={cancelTaskConfirmId !== null}
        onConfirm={executeCancelTask}
        onCancel={() => setCancelTaskConfirmId(null)}
        title="Batalkan Tugas"
        description="Apakah Anda yakin ingin membatalkan pengiriman tugas ini? Data nilai dan masukan dari tutor mungkin akan hilang."
      />

    </div>
  );
}

const SectionCompleteButton = ({ sectionKey, completions, handleMarkComplete, className = '' }: { sectionKey: string, completions: Set<string>, handleMarkComplete: (key: string) => void, className?: string }) => {
  const isDone = completions.has(sectionKey);
  return (
    <Button
      size="sm"
      onClick={() => !isDone && handleMarkComplete(sectionKey)}
      disabled={isDone}
      className={`font-bold ${isDone ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-not-allowed border-emerald-200'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
        } border ${className || 'mt-4 w-full sm:w-auto'}`}
    >
      {isDone ? (
        <><CheckCircle2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Selesai</span></>
      ) : (
        <><CheckCircle2 className="w-4 h-4 sm:hidden" /> <span className="hidden sm:inline">Tandai Selesai</span></>
      )}
    </Button>
  );
};
