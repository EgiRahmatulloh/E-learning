import { useState, useEffect, useRef } from "react";
import { Calendar, Home, ChevronRight, ChevronLeft, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Limit shown items on the homepage to 5
  const displayAgendas = isDetailed ? agendas : agendas.slice(0, 5);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 280;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  // If detailed page view (halaman menu agenda)
  if (isDetailed) {
    return (
      <section id="agenda" className="pt-8 pb-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh]">
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

          {/* Agenda items grid (4-Column Grid, News Style) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
              <span className="text-sm font-bold text-[#9c27b0] uppercase tracking-widest">Memuat Agenda...</span>
            </div>
          ) : displayAgendas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {displayAgendas.map((agenda) => (
                <div 
                  key={agenda.id} 
                  className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 text-left"
                >
                  {/* Top part: Image + Execution Date overlay */}
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

                    {/* Date Badge overlay on top left */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85%] z-10 text-center">
                      <span className="inline-block w-full bg-[#ffb300] text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full uppercase shadow-md tracking-wider truncate">
                        {agenda.pelaksanaan}
                      </span>
                    </div>
                  </div>

                  {/* Bottom part: Title + Details */}
                  <div className="space-y-3 text-left px-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-[#00ff00] leading-tight uppercase line-clamp-2">
                        {agenda.nama}
                      </h3>
                      <p className="text-white/80 text-[10px] font-semibold leading-relaxed line-clamp-3">
                        {agenda.keterangan || "Kegiatan resmi PKBM Menuju Makmur untuk meningkatkan kompetensi warga belajar."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center gap-2 text-[#00ff00] text-[9px] font-black uppercase tracking-wider">
                        <Home className="h-3 w-3 shrink-0" />
                        <span className="truncate">{agenda.lokasi || "PKBM MENUJU MAKMUR"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#00ff00] text-[9px] font-black uppercase tracking-wider">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{agenda.waktu || "08.00 WIB"}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-[#20108a] rounded-3xl p-8 text-center space-y-4 shadow-xl border border-blue-900/30">
              <div className="h-16 w-16 bg-[#00ff00]/10 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="h-8 w-8 text-[#00ff00]" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Belum Ada Agenda</h3>
              <p className="text-white/70 font-bold text-xs">
                Jadwal pelaksanaan kegiatan saat ini belum tersedia.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }

  // Otherwise, default landing homepage view
  return (
    <section id="agenda" className="pt-8 pb-16 bg-white relative overflow-hidden">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Agenda
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">AGENDA</span>{" "}
            <span className="text-[#ff6105]">PKBM MENUJU MAKMUR</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Agenda kegiatan disusun sebagai informasi mengenai rangkaian kegiatan yang akan dilaksanakan di PKBM Menuju Makmur agar seluruh kegiatan dapat berjalan dengan tertib, terarah, dan sesuai tujuan.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
            <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat Agenda...</span>
          </div>
        ) : displayAgendas.length > 0 ? (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {/* Navigation arrows */}
              {displayAgendas.length > 1 && (
                <>
                  <button
                    onClick={() => handleScroll("left")}
                    aria-label="Geser kiri"
                    className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-[#280f91] hover:bg-[#280f91] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleScroll("right")}
                    aria-label="Geser kanan"
                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-[#280f91] hover:bg-[#280f91] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div
                ref={scrollRef}
                className={`flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-4 pb-4 ${
                  displayAgendas.length === 1 ? "justify-center" : ""
                }`}
              >
                {displayAgendas.map((agenda) => (
                  <div
                    key={agenda.id}
                    data-card
                    className="snap-start shrink-0 w-[calc(100%-1rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] bg-white rounded-3xl overflow-hidden p-4 flex flex-col justify-between border border-slate-300 group hover:border-[#ff6105] hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Date small top-left in orange */}
                    <div className="px-1 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6105]">
                        {agenda.pelaksanaan}
                      </span>
                    </div>

                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-50">
                      {agenda.foto ? (
                        <img
                          src={agenda.foto}
                          alt={agenda.nama}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <Calendar className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-left px-1">
                      <h3 className="text-sm font-black text-[#280f91] leading-tight uppercase line-clamp-2 group-hover:text-[#ff6105] transition-colors">
                        {agenda.nama}
                      </h3>

                      <div className="flex items-start gap-2 text-slate-500">
                        <Home className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-black uppercase tracking-wide truncate">
                          {agenda.lokasi || "PKBM MENUJU MAKMUR"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-500">
                        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-black uppercase tracking-wide truncate">
                          {agenda.waktu || "08.00 WIB"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {agendas.length > 0 && (
              <div className="text-center flex justify-center">
                <Button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate("/agenda");
                    } else {
                      window.history.pushState({}, "", "/agenda");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }
                  }}
                  className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer"
                >
                  Lihat Selengkapnya
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Agenda</h3>
            <p className="text-slate-500 font-bold text-xs leading-relaxed">
              Jadwal pelaksanaan kegiatan saat ini belum dipublikasikan oleh administrator.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
