import { useState, useEffect, useRef } from "react";
import { Calendar, Home, ChevronRight, ChevronLeft, Clock, ShieldAlert, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter & pagination
  const filteredAgendas = agendas.filter((a) =>
    a.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const totalPages = Math.ceil(filteredAgendas.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAgendas = filteredAgendas.slice(indexOfFirstItem, indexOfLastItem);

  // Limit shown items on the homepage to 5
  const displayAgendas = agendas.slice(0, 5);
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
      <section id="agenda" className="pt-6 pb-12 bg-white relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

          {/* HEADER SECTION */}
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-4 animate-in fade-in duration-700">
            <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block">
              PROGRAM KEGIATAN SEKOLAH
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight uppercase">
              AGENDA <span className="text-[#ff6105]">KEGIATAN</span>
            </h2>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed max-w-2xl mx-auto">
              Agenda kegiatan disusun sebagai informasi mengenai rangkaian kegiatan yang akan dilaksanakan di PKBM Menuju Makmur agar seluruh kegiatan dapat berjalan dengan tertib, terarah, dan sesuai tujuan
            </p>
          </div>

          {/* SEARCH & ITEMS PER PAGE FILTER */}
          <div className="max-w-4xl mx-auto mb-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2.5 flex-wrap justify-center w-full md:w-auto">
              {[0, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => { setItemsPerPage(num || filteredAgendas.length); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                    itemsPerPage === (num || filteredAgendas.length)
                      ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {num === 0 ? "Semua" : num}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari nama agenda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#280f91]/30"
              />
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* AGENDA GRID */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
              <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat Agenda...</span>
            </div>
          ) : currentAgendas.length > 0 ? (
            <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {currentAgendas.map((agenda) => (
                <div 
                  key={agenda.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200 group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 text-left"
                >
                  {/* Image + Date overlay */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {agenda.foto ? (
                      <img 
                        src={agenda.foto} 
                        alt={agenda.nama} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}

                    {/* Date Badge overlay */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85%] z-10 text-center">
                      <span className="inline-block w-full bg-[#ffb300] text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full uppercase shadow-md tracking-wider truncate">
                        {agenda.pelaksanaan}
                      </span>
                    </div>
                  </div>

                  {/* Title + Details */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-[#280f91] transition-colors leading-tight uppercase line-clamp-2">
                        {agenda.nama}
                      </h3>
                      <p className="text-slate-600 text-[10px] font-semibold leading-relaxed line-clamp-3">
                        {agenda.keterangan || "Kegiatan resmi PKBM Menuju Makmur untuk meningkatkan kompetensi warga belajar."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                        <Home className="h-3 w-3 shrink-0" />
                        <span className="truncate">{agenda.lokasi || "PKBM MENUJU MAKMUR"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{agenda.waktu || "08.00 WIB"}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl bg-white text-[#280f91] hover:bg-[#280f91] hover:text-white border border-slate-200 font-extrabold text-xs h-10 px-4 cursor-pointer disabled:opacity-50"
                  >
                    Sebelumnya
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                        currentPage === page
                          ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl bg-white text-[#280f91] hover:bg-[#280f91] hover:text-white border border-slate-200 font-extrabold text-xs h-10 px-4 cursor-pointer disabled:opacity-50"
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-lg">
              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider">Belum Ada Agenda</h3>
              <p className="text-slate-400 font-bold text-xs">
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
            PROGRAM KEGIATAN SEKOLAH
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">AGENDA</span>{" "}
            <span className="text-[#ff6105]">KEGIATAN</span>
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
