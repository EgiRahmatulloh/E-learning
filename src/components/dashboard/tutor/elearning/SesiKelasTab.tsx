import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Video, MessageCircle, FileQuestion, Calendar } from "lucide-react";

export default function SesiKelasTab() {
  const [expandedSesi, setExpandedSesi] = useState<number | null>(1);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((sesi) => (
        <Card key={sesi} className="border-slate-200/60 bg-white shadow-sm rounded-2xl overflow-hidden">
          {/* Header Sesi */}
          <div 
            className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${expandedSesi === sesi ? 'bg-[#280f91] text-white' : 'hover:bg-slate-50 text-[#280f91]'}`}
            onClick={() => setExpandedSesi(expandedSesi === sesi ? null : sesi)}
          >
            <h3 className="font-black text-lg">Sesi {sesi}: Topik Pembahasan {sesi}</h3>
            <ChevronDown className={`w-5 h-5 transition-transform ${expandedSesi === sesi ? 'rotate-180 text-white' : 'text-slate-400'}`} />
          </div>

          {/* Konten Sesi */}
          {expandedSesi === sesi && (
            <div className="p-6 space-y-8 bg-white text-slate-800">
              
              {/* Pengaturan Kehadiran */}
              <section>
                <h4 className="font-bold flex items-center gap-2 mb-3 text-[#ff6105]">
                  <Calendar className="w-4 h-4" /> Pengaturan Kehadiran
                </h4>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Buka Tanggal</label>
                    <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Tutup Tanggal</label>
                    <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                  <Button size="sm" className="bg-[#280f91] hover:bg-[#ff6105] text-white">Simpan</Button>
                </div>
              </section>

              {/* Inisiasi & Pengayaan */}
              <section>
                <h4 className="font-bold flex items-center gap-2 mb-3 text-[#ff6105]">
                  <Video className="w-4 h-4" /> Materi Inisiasi & Pengayaan
                </h4>
                <div className="space-y-3">
                  <textarea 
                    className="w-full border-slate-200 rounded-xl p-3 text-sm min-h-[100px] bg-slate-50 focus:border-[#280f91] focus:ring-[#280f91]"
                    placeholder="Tulis deskripsi materi atau tempelkan (embed) link video YouTube di sini..."
                  ></textarea>
                  <Button size="sm" variant="outline" className="text-[#280f91] border-[#280f91] hover:bg-[#280f91] hover:text-white">
                    Simpan Materi
                  </Button>
                </div>
              </section>

              {/* Forum Diskusi */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold flex items-center gap-2 text-[#ff6105]">
                    <MessageCircle className="w-4 h-4" /> Forum Diskusi Sesi {sesi}
                  </h4>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                    + Tambah Topik
                  </Button>
                </div>
                
                <div className="border rounded-xl p-4 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-sm text-slate-800">Pertanyaan Pemantik dari Tutor</h5>
                    <span className="text-xs font-bold px-2 py-1 bg-[#280f91]/10 text-[#280f91] rounded-md">Wajib</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Bagaimana pendapat Anda tentang materi minggu ini? Jelaskan dengan contoh konkrit!</p>
                  
                  {/* Contoh Jawaban Mahasiswa */}
                  <div className="pl-4 border-l-2 border-slate-200 space-y-3 mt-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-800 mb-1">Ahmad Fauzi</p>
                      <p className="text-sm text-slate-600 mb-3">Menurut saya, konsep tersebut sangat aplikatif dalam kehidupan sehari-hari...</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Nilai Instan:</span>
                        <input type="number" min="0" max="100" placeholder="0" className="w-16 h-7 text-xs border-slate-200 rounded text-center focus:border-[#ff6105]" />
                        <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Latihan PG */}
              <section>
                <h4 className="font-bold flex items-center gap-2 mb-3 text-[#ff6105]">
                  <FileQuestion className="w-4 h-4" /> Statistik Latihan PG
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Rata-rata Kelas</p>
                    <p className="text-2xl font-black text-blue-800">78.5</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-rose-600 uppercase mb-1">Soal Tersulit</p>
                    <p className="text-2xl font-black text-rose-800">No. 4</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Mahasiswa Selesai</p>
                    <p className="text-2xl font-black text-emerald-800">24/30</p>
                  </div>
                </div>
              </section>

            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
