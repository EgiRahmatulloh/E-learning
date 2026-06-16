import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Upload, Clock, CheckCircle } from "lucide-react";

export default function ManajemenTugasTab() {
  const [selectedTugas, setSelectedTugas] = useState(3);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Selector Tugas */}
      <div className="flex gap-2">
        {[3, 5, 7].map(tugas => (
          <Button 
            key={tugas}
            variant={selectedTugas === tugas ? "default" : "outline"}
            onClick={() => setSelectedTugas(tugas)}
            className={selectedTugas === tugas ? "bg-[#280f91] text-white" : "text-slate-500"}
          >
            Tugas Sesi {tugas}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Pengaturan Tugas */}
        <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl lg:col-span-1 h-fit space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#280f91] mb-1">Pengaturan Tugas {selectedTugas}</h3>
            <p className="text-xs font-semibold text-slate-500">Unggah soal dan atur batas waktu.</p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Unggah File Soal</p>
            <p className="text-xs text-slate-400">.PDF / .DOCX</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Due Date
              </label>
              <input type="datetime-local" className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-500" /> Cut-off Date
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
