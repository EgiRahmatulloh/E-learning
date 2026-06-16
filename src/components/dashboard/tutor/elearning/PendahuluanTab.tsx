import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Reply, Users } from "lucide-react";

export default function PendahuluanTab() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Dummy logic for drop
      alert(`File ${e.dataTransfer.files[0].name} berhasil dipilih!`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
        <h3 className="text-lg font-black text-[#280f91] mb-2 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#ff6105]" />
          Unggah Rancangan Aktivitas & Tata Tertib
        </h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Tarik dan lepaskan file PDF atau Word ke area di bawah ini, atau klik untuk mencari file.
        </p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging ? "border-[#ff6105] bg-[#ff6105]/5" : "border-slate-300 hover:bg-slate-50"
          }`}
        >
          <input type="file" className="hidden" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              alert(`File ${e.target.files[0].name} berhasil dipilih!`);
            }
          }} />
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-bold">Seret & Lepas file di sini</p>
          <p className="text-xs text-slate-400 mt-1">Maksimal ukuran file: 10MB (.PDF, .DOCX)</p>
          <Button size="sm" className="mt-4 bg-[#280f91] hover:bg-[#ff6105] text-white">
            Pilih File
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-slate-200/60 bg-white shadow-sm rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-[#280f91] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ff6105]" />
              Forum Perkenalan
            </h3>
            <p className="text-sm text-slate-500 font-medium">Lihat dan balas salam perkenalan dari warga belajar.</p>
          </div>
          <Button size="sm" variant="outline" className="border-[#280f91] text-[#280f91] hover:bg-[#280f91] hover:text-white font-bold">
            Balas Massal
          </Button>
        </div>

        <div className="space-y-4">
          {/* Mockup Data */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#280f91] flex items-center justify-center text-white font-bold">
                    WB
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Warga Belajar {item}</h4>
                    <p className="text-xs text-slate-500">10 menit yang lalu</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-[#ff6105] hover:bg-[#ff6105]/10 h-8 px-2">
                  <Reply className="w-4 h-4 mr-1" /> Balas
                </Button>
              </div>
              <p className="text-sm text-slate-600 ml-13">
                Halo semuanya, perkenalkan nama saya Warga Belajar {item}. Salam kenal dan mohon bimbingannya selama sesi kelas ini berlangsung.
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
