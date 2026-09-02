import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ShieldAlert, Award, Search } from "lucide-react";

interface Tutor {
  id: number;
  nama: string;
  tutorMapel: string;
  program: string;
  nip: string;
  tempatTglLahir: string;
  jenisKelamin: string;
  agama: string;
  pendidikan: string;
  email: string;
  alamat: string;
  foto: string;
  tanggalMulaiTugas: string;
  nomorSkPengangkatan: string;
  lembagaPengangkat: string;
  nomorSkPenugasan: string;
  lembagaPenugas: string;
}

interface TutorsProps {
  isDetailed?: boolean;
  onNavigate?: (path: string) => void;
}

export default function Tutors({ isDetailed = false, onNavigate }: TutorsProps) {
  const [tutorsList, setTutorsList] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProgramFilter]);

  useEffect(() => {
    fetch("/api/public-tutors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTutorsList(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch tutors list:", err))
      .finally(() => setLoading(false));
  }, []);

  // Limit homepage - 10 items, per view tetap 5 (20%) agar bisa digeser
  const displayTutors = isDetailed ? tutorsList : tutorsList.slice(0, 10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 240;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  // DETAILED VIEW (Menu Tutor)
  if (isDetailed) {
    const filteredTutors = tutorsList.filter((tutor) => {
      const matchesSearch = tutor.nama.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesProgram = true;
      if (selectedProgramFilter) {
        matchesProgram = tutor.program?.toUpperCase() === selectedProgramFilter.toUpperCase();
      }
      return matchesSearch && matchesProgram;
    });

    const totalPages = Math.ceil(filteredTutors.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTutors = filteredTutors.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <section id="tutor" className="pt-6 pb-12 bg-white relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

          {/* HEADER SECTION */}
          <div className="text-center mb-8 space-y-4 animate-in fade-in duration-700">
            <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block">
              TENAGA PENDIDIK
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight uppercase">
              MENGENAL <span className="text-[#ff6105]">TUTOR KAMI</span>
            </h2>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed tracking-tighter">
              Tutor PKBM Menuju Makmur merupakan tenaga pendidik yang berdedikasi dalam membimbing, mendampingi, dan memberikan ilmu pengetahuan kepada warga belajar guna meningkatkan kualitas pendidikan dan keterampilan
            </p>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="max-w-4xl mx-auto mb-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2.5 flex-wrap justify-center w-full md:w-auto">
              <button
                onClick={() => { setSelectedProgramFilter(null); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                  selectedProgramFilter === null
                    ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Paket
              </button>
              <button
                onClick={() => { setSelectedProgramFilter("PAKET A"); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                  selectedProgramFilter === "PAKET A"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Paket A
              </button>
              <button
                onClick={() => { setSelectedProgramFilter("PAKET B"); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                  selectedProgramFilter === "PAKET B"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Paket B
              </button>
              <button
                onClick={() => { setSelectedProgramFilter("PAKET C"); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                  selectedProgramFilter === "PAKET C"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Paket C
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari nama tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#280f91]/30"
              />
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* TUTORS GRID */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
              <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat data tutor...</span>
            </div>
          ) : currentTutors.length > 0 ? (
            <div className="space-y-10">
            <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
              {currentTutors.map((tutor) => (
                <Dialog key={tutor.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] max-w-[220px] bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      {/* Photo */}
                      <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                        {tutor.foto ? (
                          <img 
                            src={tutor.foto} 
                            alt={tutor.nama} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name & mapel below photo */}
                      <div className="p-3 text-center space-y-1.5">
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-[#280f91] transition-colors uppercase leading-tight line-clamp-2">
                          {tutor.nama}
                        </h3>
                        <span className="inline-block text-[9px] font-black text-white bg-[#9c27b0] rounded-full px-2.5 py-0.5 uppercase tracking-wider truncate max-w-full">
                          {tutor.tutorMapel || tutor.program || "-"}
                        </span>
                      </div>
                    </div>
                  </DialogTrigger>

                  {/* DETAIL DIALOG POP-UP */}
                  <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                      <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#ff6105]" /> Detail Profil Pendidik
                      </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Photo Column */}
                      <div className="sm:col-span-1 space-y-4">
                        <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                          {tutor.foto ? (
                            <img 
                              src={tutor.foto} 
                              alt={tutor.nama}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mulai Tugas</span>
                          <span className="text-xs font-black text-slate-700">{tutor.tanggalMulaiTugas || "-"}</span>
                        </div>
                      </div>

                      {/* Detail Fields Column */}
                      <div className="sm:col-span-2 space-y-4 text-slate-700">
                        <div className="border-b border-slate-100 pb-2">
                          <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{tutor.nama}</h2>
                          <span className="inline-block bg-orange-100 text-[#ff6105] font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                            {tutor.tutorMapel}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs leading-relaxed">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Program Tugas</span>
                            <span className="text-slate-800 font-bold uppercase">{tutor.program || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NIP</span>
                            <span className="text-slate-800 font-bold">{tutor.nip || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tempat, Tgl Lahir</span>
                            <span className="text-slate-800 font-bold">{tutor.tempatTglLahir || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jenis Kelamin</span>
                            <span className="text-slate-800 font-bold">{tutor.jenisKelamin || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Agama</span>
                            <span className="text-slate-800 font-bold">{tutor.agama || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pendidikan</span>
                            <span className="text-slate-800 font-bold">{tutor.pendidikan || "-"}</span>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                            <span className="text-slate-800 font-bold leading-normal block">{tutor.alamat || "-"}</span>
                          </div>

                        </div>

                        {/* SK Details */}
                        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5 text-xs text-slate-800">
                          <span className="block text-[9px] font-black text-[#280f91] uppercase tracking-wider border-b border-slate-200 pb-1">Keterangan SK Pengangkatan / Penugasan</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase">SK PENGANGKATAN</p>
                              <p>{tutor.nomorSkPengangkatan || "-"}</p>
                              <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPengangkat}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase">SK PENUGASAN</p>
                              <p>{tutor.nomorSkPenugasan || "-"}</p>
                              <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPenugas}</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                          Tutup Profil
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider">Belum Ada Tutor</h3>
              <p className="text-slate-400 font-bold text-xs">
                Data tenaga pendidik saat ini belum tersedia.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }

  // DEFAULT HOMEPAGE VIEW (Tenaga Pendidik Section)
  return (
    <section id="tutor" className="pt-8 pb-16 bg-white relative">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Tenaga Pendidik
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">MENGENAL</span>{" "}
            <span className="text-[#ff6105]">TUTOR KAMI</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed tracking-tighter">
            Tutor PKBM Menuju Makmur merupakan tenaga pendidik yang berdedikasi dalam membimbing, mendampingi, dan memberikan ilmu pengetahuan kepada warga belajar guna meningkatkan kualitas pendidikan dan keterampilan.
          </p>
        </div>

        {/* Dynamic Tutor Carousel on Homepage */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#280f91] border-t-transparent" />
          </div>
        ) : displayTutors.length > 0 ? (
          <div className="space-y-8">
            <div className="relative">
              {displayTutors.length >= 6 && (
                <>
                  <button
                    onClick={() => handleScroll("left")}
                    aria-label="Geser kiri"
                    type="button"
                    className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-[#280f91] hover:bg-[#280f91] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5 pointer-events-none" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleScroll("right")}
                    aria-label="Geser kanan"
                    type="button"
                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-[#280f91] hover:bg-[#280f91] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5 pointer-events-none" aria-hidden="true" />
                  </button>
                </>
              )}

              <div
                ref={scrollRef}
                className={`flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-4 pb-4 ${
                  displayTutors.length <= 4 ? "justify-center" : ""
                }`}
              >
                {displayTutors.map((tutor) => (
                  <Dialog key={tutor.id}>
                    <DialogTrigger asChild>
                      <div
                        data-card
                        className="snap-start shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] overflow-hidden border border-slate-300 hover:border-[#ff6105] rounded-3xl transition-all duration-300 flex flex-col bg-white group cursor-pointer text-left"
                      >
                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-50">
                          {tutor.foto ? (
                            <img
                              src={tutor.foto}
                              alt={tutor.nama}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 space-y-1.5 text-center">
                          <h3 className="text-sm font-black text-[#280f91] leading-tight uppercase line-clamp-2">
                            {tutor.nama}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-wider truncate">
                            <span className="inline-block bg-[#9c27b0] text-white rounded-full px-2.5 py-0.5 max-w-full truncate">
                              {tutor.tutorMapel || tutor.program || "Tutor"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </DialogTrigger>

                    {/* DETAIL DIALOG POP-UP */}
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
                      <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                          <Award className="h-5 w-5 text-[#ff6105]" /> Detail Profil Pendidik
                        </DialogTitle>
                      </DialogHeader>

                      <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="sm:col-span-1 space-y-4">
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                            {tutor.foto ? (
                              <img
                                src={tutor.foto}
                                alt={tutor.nama}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                No Photo
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mulai Tugas</span>
                            <span className="text-xs font-black text-slate-700">{tutor.tanggalMulaiTugas || "-"}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-4 text-slate-700">
                          <div className="border-b border-slate-100 pb-2">
                            <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{tutor.nama}</h2>
                            <span className="inline-block bg-orange-100 text-[#ff6105] font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                              {tutor.tutorMapel || tutor.program || "-"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs leading-relaxed">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Program Tugas</span>
                              <span className="text-slate-800 font-bold uppercase">{tutor.program || "-"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NIP</span>
                              <span className="text-slate-800 font-bold">{tutor.nip || "-"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tempat, Tgl Lahir</span>
                              <span className="text-slate-800 font-bold">{tutor.tempatTglLahir || "-"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jenis Kelamin</span>
                              <span className="text-slate-800 font-bold">{tutor.jenisKelamin || "-"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Agama</span>
                              <span className="text-slate-800 font-bold">{tutor.agama || "-"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pendidikan</span>
                              <span className="text-slate-800 font-bold">{tutor.pendidikan || "-"}</span>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                              <span className="text-slate-800 font-bold leading-normal block">{tutor.alamat || "-"}</span>
                            </div>
                          </div>

                          <div className="bg-[#cdeff6]/40 border border-[#a6e5f3] p-3.5 rounded-2xl space-y-2.5 text-xs text-slate-800">
                            <span className="block text-[9px] font-black text-[#280f91] uppercase tracking-wider border-b border-[#a6e5f3] pb-1">Keterangan SK Pengangkatan / Penugasan</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                              <div>
                                <p className="text-[9px] text-slate-400 font-black uppercase">SK PENGANGKATAN</p>
                                <p>{tutor.nomorSkPengangkatan || "-"}</p>
                                <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPengangkat}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-black uppercase">SK PENUGASAN</p>
                                <p>{tutor.nomorSkPenugasan || "-"}</p>
                                <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPenugas}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="border-t border-slate-100 pt-4">
                        <DialogClose asChild>
                          <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                            Tutup Profil
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>

            <div className="text-center flex justify-center">
              <Button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate("/tutor");
                  } else {
                    window.history.pushState({}, "", "/tutor");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }
                }}
                className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer"
              >
                Lihat Selengkapnya
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Tutor</h3>
            <p className="text-slate-500 font-bold text-xs">
              Data tutor saat ini belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
