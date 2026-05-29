import { AlertCircle, ArrowRight } from "lucide-react";

export default function Ticker() {
  return (
    <div className="bg-[#e5fbff] border-b border-blue-200/60 py-3.5 px-4 overflow-hidden relative">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
          <AlertCircle className="h-3.5 w-3.5" />
          Pengumuman
        </span>
        <div className="text-sm md:text-base font-bold text-[#280f91] text-center md:text-left leading-relaxed">
          📢 PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B. 
          <a href="#agenda" className="text-[#ff6105] hover:underline ml-1.5 inline-flex items-center gap-0.5">
            Lihat detail agenda <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
