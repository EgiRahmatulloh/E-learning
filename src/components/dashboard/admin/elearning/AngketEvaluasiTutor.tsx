import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Save,
  FileQuestion,
  FileSpreadsheet,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { downloadExcel } from "@/lib/utils";

interface EvaluationResponse {
  id: number;
  evaluationId: number;
  studentId: number;
  studentName: string;
  sessionId: number;
  sessionName: string;
  courseId: number;
  courseName: string;
  kelas: string;
  score: number;
  createdAt: string;
}

export default function AngketEvaluasiTutor() {
  const [questions, setQuestions] = useState<{ id: number; text: string }[]>(
    [],
  );
  const [responses, setResponses] = useState<EvaluationResponse[]>([]);
  const [setups, setSetups] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(true);

  const [reportError, setReportError] = useState<string | null>(null);

  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [selectedMapel, setSelectedMapel] = useState<string>("Semua");
  const [selectedSesi, setSelectedSesi] = useState<string>("Semua");

  const uniqueKelas = useMemo(
    () =>
      Array.from(new Set(responses.map((r) => r.kelas || "-"))).filter(Boolean),
    [responses],
  );
  const uniqueMapel = useMemo(
    () =>
      Array.from(new Set(responses.map((r) => r.courseName || "-"))).filter(
        Boolean,
      ),
    [responses],
  );
  const uniqueSesi = useMemo(
    () =>
      Array.from(new Set(responses.map((r) => r.sessionName || "-"))).filter(
        Boolean,
      ),
    [responses],
  );

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchKelas =
        selectedKelas === "Semua" || (r.kelas || "-") === selectedKelas;
      const matchMapel =
        selectedMapel === "Semua" || (r.courseName || "-") === selectedMapel;
      const matchSesi =
        selectedSesi === "Semua" || (r.sessionName || "-") === selectedSesi;
      return matchKelas && matchMapel && matchSesi;
    });
  }, [responses, selectedKelas, selectedMapel, selectedSesi]);

  const filteredAggregated = useMemo(() => {
    return questions.map((q) => {
      const evResponses = filteredResponses.filter(
        (r) => r.evaluationId === q.id,
      );
      const totalScore = evResponses.reduce((sum, r) => sum + r.score, 0);
      const avgScore =
        evResponses.length > 0
          ? Math.round((totalScore / evResponses.length) * 100) / 100
          : 0;
      return {
        questionId: q.id,
        question: q.text,
        scaleMax: 5,
        responseCount: evResponses.length,
        avgScore,
      };
    });
  }, [questions, filteredResponses]);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/elearning/evaluations", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setQuestions(
            json.data.map((q: any) => ({ id: q.id, text: q.question })),
          );
        } else {
          setQuestions([
            { id: 1, text: "Tutor menguasai materi pembelajaran dengan baik." },
            {
              id: 2,
              text: "Tutor merespon pertanyaan dengan cepat dan jelas.",
            },
            { id: 3, text: "Materi yang diberikan mudah dipahami." },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchResponses() {
      try {
        setLoadingReport(true);
        setReportError(null);
        const res = await fetch("/api/elearning/evaluation-responses", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) {
          setResponses(json.data.responses || []);
        } else {
          setReportError(json.message || "Gagal memuat data laporan");
        }
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setReportError(msg);
        toast.error("Gagal memuat data laporan angket", { description: msg });
      } finally {
        setLoadingReport(false);
      }
    }

    async function fetchSetups() {
      try {
        const res = await fetch("/api/elearning/setups", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) {
          setSetups(json.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchQuestions();
    fetchResponses();
    fetchSetups();
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: "" }]);
  };

  const updateQuestion = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (questions.some((q) => !q.text.trim())) {
      toast.error("Ada pertanyaan yang masih kosong. Harap isi atau hapus.");
      return;
    }
    try {
      const res = await fetch("/api/elearning/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          questions: questions.map((q) => ({ text: q.text })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Berhasil menyimpan form kuesioner evaluasi tutor.");
      } else {
        toast.error("Gagal", { description: json.message });
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan", { description: err.message });
    }
  };

  const handleExportRekap = () => {
    if (filteredAggregated.length === 0) {
      toast.error("Tidak ada data rekap untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "Pertanyaan",
      "Skala Maks",
      "Jumlah Respons",
      "Rata-rata Skor",
    ];
    const rows = filteredAggregated.map((item, idx) => [
      idx + 1,
      item.question || "",
      item.scaleMax,
      item.responseCount,
      item.avgScore,
    ]);
    downloadExcel(headers, rows, "laporan_rekap_angket_evaluasi.xlsx");
    toast.success("Berhasil mengunduh rekap angket (.XLSX)");
  };

  const handleApproveAngket = async (
    setupId: number,
    isAngketApproved: boolean,
  ) => {
    try {
      const res = await fetch(
        `/api/elearning/setups/${setupId}/approve-angket`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ isAngketApproved }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Berhasil ${isAngketApproved ? "membuka" : "mengunci"} angket untuk setup ini.`,
        );
        setSetups(
          setups.map((s) =>
            s.id === setupId ? { ...s, isAngketApproved } : s,
          ),
        );
      } else {
        toast.error(data.message || "Gagal mengubah status angket");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan", { description: err.message });
    }
  };

  const handleExportDetail = () => {
    if (filteredResponses.length === 0) {
      toast.error("Tidak ada data detail untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "Nama Warga Belajar",
      "Kelas",
      "Mata Pelajaran",
      "Sesi",
      "Pertanyaan",
      "Skor",
      "Tanggal",
    ];
    const rows = filteredResponses.map((r, idx) => {
      const evaluation = filteredAggregated.find(
        (a) => a.questionId === r.evaluationId,
      );
      return [
        idx + 1,
        r.studentName || "",
        r.kelas || "",
        r.courseName || "",
        r.sessionName || "",
        evaluation?.question || `Evaluasi #${r.evaluationId}`,
        r.score,
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "",
      ];
    });
    downloadExcel(headers, rows, "laporan_detail_angket_evaluasi.xlsx");
    toast.success("Berhasil mengunduh detail angket (.XLSX)");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-cyan-900">
            Angket Evaluasi Tutor
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Atur pertanyaan untuk kuesioner evaluasi kinerja tutor pada akhir
            semester.
          </p>
        </div>
      </div>

      <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="font-bold text-slate-800">Daftar Pertanyaan Angket</h4>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {questions.map((q, index) => (
            <div key={q.id} className="flex items-start gap-3">
              <div className="bg-slate-100 text-slate-500 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                {index + 1}
              </div>
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, e.target.value)}
                placeholder="Tulis pertanyaan evaluasi di sini..."
                className="flex-1 px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-slate-50"
              />
              <button
                onClick={() => removeQuestion(q.id)}
                className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-rose-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <Button
            onClick={addQuestion}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl font-bold w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Pertanyaan
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-[#280f91] to-[#401bbd] hover:opacity-90 text-white rounded-xl font-bold px-8 shadow-md w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" /> Simpan Konfigurasi
          </Button>
        </div>
      </Card>

      {/* Laporan Hasil Angket */}
      <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Laporan Hasil Angket</h4>
              <p className="text-xs text-slate-500 font-medium">
                Rekapitulasi hasil evaluasi dari warga belajar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportRekap}
              disabled={loadingReport || !!reportError}
              className="bg-[#ff6105] hover:bg-[#e55800] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Rekap (.XLSX)
            </Button>
            <Button
              onClick={handleExportDetail}
              disabled={loadingReport || !!reportError}
              className="bg-[#280f91] hover:bg-[#1e0b6e] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Detail (.XLSX)
            </Button>
          </div>
        </div>

        {loadingReport ? (
          <div className="py-8 text-center text-slate-400 font-medium">
            Memuat data laporan...
          </div>
        ) : reportError ? (
          <div className="py-8 text-center border-2 border-dashed border-red-200 rounded-xl bg-red-50/50">
            <p className="text-red-500 font-medium text-sm">
              Gagal memuat data laporan.
            </p>
            <p className="text-red-400 text-xs mt-1">{reportError}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 border-b pb-4">
              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Kelas
                </label>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 truncate"
                >
                  <option value="Semua">Semua Kelas</option>
                  {uniqueKelas.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Mata Pelajaran
                </label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 truncate"
                >
                  <option value="Semua">Semua Mapel</option>
                  {uniqueMapel.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Sesi
                </label>
                <select
                  value={selectedSesi}
                  onChange={(e) => setSelectedSesi(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                >
                  <option value="Semua">Semua Sesi</option>
                  {uniqueSesi.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredAggregated.length > 0 && filteredResponses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 text-center w-12">NO</th>
                      <th className="py-3 px-4">Pertanyaan</th>
                      <th className="py-3 px-4 text-center">Skala</th>
                      <th className="py-3 px-4 text-center">Respons</th>
                      <th className="py-3 px-4 text-center">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAggregated.map((item, idx) => (
                      <tr
                        key={item.questionId}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {item.question}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          /{item.scaleMax}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {item.responseCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-full ${
                              item.avgScore >= 4
                                ? "bg-emerald-100 text-emerald-800"
                                : item.avgScore >= 3
                                  ? "bg-blue-100 text-blue-800"
                                  : item.avgScore >= 2
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.avgScore.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium text-sm">
                  Tidak ada data respons angket untuk filter yang dipilih.
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Pengaturan Persetujuan Angket (Unlock) */}
      <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-rose-50 rounded-xl">
            <BarChart3 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">
              Persetujuan Hasil Angket
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Buka akses agar Tutor bisa melihat hasil angket kinerja mereka.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Sesi (Jml)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {setups.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-700">
                    {s.kelas}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">
                    {s.mapel}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.jumlahSesi} Sesi
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.isAngketApproved ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-full text-xs">
                        Terbuka
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-full text-xs">
                        Terkunci
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleApproveAngket(s.id, !s.isAngketApproved)
                      }
                      variant={s.isAngketApproved ? "outline" : "default"}
                      className={
                        s.isAngketApproved
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }
                    >
                      {s.isAngketApproved ? "Kunci" : "Approve & Buka"}
                    </Button>
                  </td>
                </tr>
              ))}
              {setups.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-400 font-medium"
                  >
                    Belum ada kelas E-Learning.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
