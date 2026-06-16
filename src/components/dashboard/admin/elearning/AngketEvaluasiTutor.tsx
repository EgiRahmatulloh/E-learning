import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, FileQuestion, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AngketEvaluasiTutor() {
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState([
    { id: 1, text: "Tutor menguasai materi pembelajaran dengan baik." },
    { id: 2, text: "Tutor merespon pertanyaan dengan cepat dan jelas." },
    { id: 3, text: "Materi yang diberikan mudah dipahami." },
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: "" }]);
  };

  const updateQuestion = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    if (questions.some(q => !q.text.trim())) {
      toast.error("Ada pertanyaan yang masih kosong. Harap isi atau hapus.");
      return;
    }
    toast.success("Berhasil menyimpan form kuesioner evaluasi tutor.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-cyan-900">Angket Evaluasi Tutor</h3>
          <p className="text-sm text-slate-500 font-medium">
            Atur pertanyaan untuk kuesioner evaluasi kinerja tutor pada akhir semester.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 border rounded-xl shadow-sm">
          <span className="text-sm font-bold text-slate-700">Status Angket:</span>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            {isActive ? "AKTIF" : "TIDAK AKTIF"}
          </button>
        </div>
      </div>

      <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="font-bold text-slate-800">Daftar Pertanyaan Angket</h4>
        </div>

        <div className="space-y-4">
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
          <Button onClick={addQuestion} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl font-bold w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Tambah Pertanyaan
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#280f91] to-[#401bbd] hover:opacity-90 text-white rounded-xl font-bold px-8 shadow-md w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" /> Simpan Konfigurasi
          </Button>
        </div>
      </Card>
      
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-800 mb-1">Informasi Fitur</h4>
          <p className="text-sm text-emerald-700/80 leading-relaxed">
            Jika status angket diaktifkan, warga belajar dapat melihat dan mengisi form evaluasi ini pada panel kelas masing-masing. Hasil agregasi penilaian akan muncul pada menu <strong>Laporan & Nilai</strong> di halaman Tutor setelah divalidasi.
          </p>
        </div>
      </div>
    </div>
  );
}
