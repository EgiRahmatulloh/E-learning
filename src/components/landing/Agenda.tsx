import { useState, useEffect } from "react";
import { Calendar, Home, ChevronRight, Clock, ShieldAlert } from "lucide-react";

interface AgendaItem {
  id: number;
  nama: string;
  pelaksanaan: string;
  waktu: string;
  peserta: string;
  lokasi: string;
  penyelenggara: string;
  penanggungjawab: string;
  keterangan: string;
  foto: string;
}

interface AgendaProps {
  isDetailed?: boolean;
  onNavigate?: (path: string) => void;
}

export default function Agenda({ isDetailed = false, onNavigate }: AgendaProps) {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agendas")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAgendas(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch agendas:", err))
      .finally(() => setLoading(false));
  }, []);

  // Limit shown items on the homepage to 4
  const displayAgendas = isDetailed ? agendas : agendas.slice(0, 4);

  // If detailed page view (halaman menu agenda)
  if (isDetailed) {
    return (
      <section id="agenda" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          


          {/* Detailed Header Title (AGENDA in purple/indigo, PKBM in bright green) */}
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center leading-none">
              <span className="text-[#9c27b0] drop-shadow-sm font-black">
                AGENDA
              </span>{" "}
              <span className="text-[#0ff60a] font-black drop-shadow-xs">
                PKBM MENUJU MAKMUR
              </span>
            </h2>
            <p className="text-slate-800 font-bold text-sm sm:text-base leading-relaxed px-4">
              Agenda kegiatan disusun sebagai informasi mengenai rangkaian kegiatan yang akan dilaksanakan di PKBM Menuju Makmur agar seluruh kegiatan dapat berjalan dengan tertib, terarah, dan sesuai tujuan
            </p>
          </div>

          {/* Agenda items list in horizontal news format */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
              <span className="text-sm font-bold text-[#9c27b0] uppercase tracking-widest">Memuat Agenda...</span>
            </div>
          ) : displayAgendas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {displayAgendas.map((agenda) => (
                <div 
                  key={agenda.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col sm:flex-row border border-slate-200/50 group"
                >
                  {/* Image part with wave at bottom */}
                  <div className="sm:w-48 h-48 shrink-0 relative overflow-hidden bg-slate-100">
                    {agenda.foto ? (
                      <img 
                        src={agenda.foto} 
                        alt={agenda.nama} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white/30">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}

                    {/* Green wave overlay at the bottom of the image */}
                    <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
                      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 text-[#98cc29] fill-current">
                        <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86C245.54,64.39,165.73,45.88,90.47,26.79,57.05,18.3,26.9,8.75,0,0V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
                      </svg>
                    </div>

                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-block bg-[#ffb300] text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full uppercase shadow-md tracking-wider">
                        {agenda.pelaksanaan}
                      </span>
                    </div>
                  </div>

                  {/* Text details in black/slate */}
                  <div className="flex-1 p-6 flex flex-col justify-start text-left space-y-2">
                    <h3 className="text-xl font-bold text-black uppercase leading-tight">
                      {agenda.nama}
                    </h3>
                    <p className="text-slate-650 text-xs font-semibold leading-relaxed">
                      {agenda.keterangan || "Deskripsi"}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200">
              <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Agenda</h3>
              <p className="text-slate-500 font-bold text-xs">
                Jadwal pelaksanaan kegiatan saat ini belum dipublikasikan oleh administrator.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }

  // Otherwise, default landing homepage view
  return (
    <section id="agenda" className="py-20 bg-[#aee2ed] border-y border-slate-350 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered, dark blue header */}
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1a0b70] uppercase">
            AGENDA
          </h2>
          <p className="text-slate-800 font-bold text-sm sm:text-base">
            Agenda PKBM Menuju Makmur
          </p>
        </div>

        {/* Grid containing 4 items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1a0b70] border-t-transparent" />
            <span className="text-sm font-bold text-[#1a0b70] uppercase tracking-widest">Memuat Agenda...</span>
          </div>
        ) : displayAgendas.length > 0 ? (
          <div className="space-y-12 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayAgendas.map((agenda) => (
                <div 
                  key={agenda.id} 
                  className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-blue-950">
                    {agenda.foto ? (
                      <img 
                        src={agenda.foto} 
                        alt={agenda.nama} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex items-center justify-center text-white/20">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}

                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85%] z-10 text-center">
                      <span className="inline-block w-full bg-[#ffb300] text-white font-extrabold text-[10px] sm:text-[11px] py-2.5 px-3 rounded-full uppercase shadow-md tracking-wider">
                        {agenda.pelaksanaan}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-left px-2">
                    <h3 className="text-sm font-black text-[#00ff00] leading-tight uppercase line-clamp-2">
                      {agenda.nama}
                    </h3>
                    
                    <div className="flex items-start gap-2.5 text-[#00ff00]">
                      <Home className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-black uppercase tracking-wide truncate">
                        {agenda.lokasi || "PKBM MENUJU MAKMUR"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-[#00ff00]">
                      <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-black uppercase tracking-wide truncate">
                        {agenda.waktu || "08.00 WIB"}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Custom pill-style READ MORE button */}
            {agendas.length > 0 && (
              <div className="text-center mt-12 flex justify-center">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate("/agenda");
                    } else {
                      window.history.pushState({}, "", "/agenda");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }
                  }}
                  className="inline-flex items-center bg-[#a8e0ea] hover:bg-[#8fd0dc] text-black font-black text-lg py-2.5 pl-2.5 pr-8 rounded-full border-4 border-black shadow-lg transition-all active:scale-95 cursor-pointer hover:shadow-black/20"
                >
                  <div className="h-11 w-11 rounded-full bg-black flex items-center justify-center text-white shrink-0 mr-4">
                    <ChevronRight className="h-6 w-6 stroke-[3]" />
                  </div>
                  <span className="tracking-wide uppercase text-sm font-black">READ MORE</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-[#20108a] rounded-3xl p-8 text-center space-y-4 shadow-xl border border-blue-900/30">
            <div className="h-16 w-16 bg-[#00ff00]/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-[#00ff00]" />
            </div>
            <h3 className="text-lg font-black text-[#00ff00] uppercase tracking-wider">Belum Ada Agenda</h3>
            <p className="text-white/80 font-bold text-xs leading-relaxed">
              Jadwal pelaksanaan kegiatan saat ini belum dipublikasikan oleh administrator.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
