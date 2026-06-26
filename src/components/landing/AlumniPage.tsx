import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Search, Award, MapPin, Briefcase, GraduationCap } from "lucide-react";

interface Alumni {
  id: number;
  nama: string;
  lulusTahun: string;
  pekerjaan: string;
  testimoni: string;
  foto: string;
  pendidikanLanjut: string;
}

interface AlumniPageProps {
  onNavigate?: (path: string) => void;
}

export default function AlumniPage(_props: AlumniPageProps) {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [selectedYear, setSelectedYear] = useState("Semua");

  // Get unique years for filter
  const uniqueYears = useMemo(() => Array.from(new Set(alumniList.map(a => a.lulusTahun).filter(Boolean))).sort().reverse(), [alumniList]);
  const yearOptions = useMemo(() => ["Semua", ...uniqueYears.length > 0 ? uniqueYears : ["2023", "2022", "2021", "2020"]], [uniqueYears]);


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/alumni")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAlumniList(data.data);
        }
      })
      .catch((err) => console.error("Gagal memuat data alumni:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAlumni = useMemo(() => alumniList.filter((a) => {
    const matchName = a.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchYear = selectedYear === "Semua" || a.lulusTahun === selectedYear;
    return matchName && matchYear;
  }), [alumniList, searchTerm, selectedYear]);

  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage) || 1;
  const currentAlumni = filteredAlumni.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section id="alumni-landing" className="pt-6 pb-12 bg-white border-y border-slate-300 relative overflow-hidden min-h-[60vh] text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Title */}
        <div className="text-center space-y-4 mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block mb-2">JEJAK ALUMNI</span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none uppercase drop-shadow-sm">
            <span className="text-[#280f91]">MENGENAL</span> <span className="text-[#ff6105]">ALUMNI</span>
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 tracking-tighter text-center">
            Alumni PKBM Menuju Makmur adalah bukti nyata bahwa pendidikan membuka jalan menuju masa depan yang lebih baik.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-3xl mx-auto mb-12 relative flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/3">
            <select
              className="w-full bg-white text-slate-700 text-sm font-semibold px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#280f91] shadow-sm cursor-pointer"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-2/3">
            <input
              type="text"
              className="w-full bg-white text-slate-700 text-sm font-semibold pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#280f91] shadow-sm placeholder-slate-400"
              placeholder="Cari nama alumni..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          </div>
        </div>

        {/* Alumni Cards Grid (5-Column Grid, Compact Style) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-slate-500 font-bold text-sm">Memuat daftar alumni...</p>
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-16 bg-white/60 border-2 border-dashed border-purple-200 rounded-3xl max-w-3xl mx-auto">
            <Award className="mx-auto text-slate-350 mb-3 h-12 w-12" />
            <h4 className="text-sm font-black text-slate-800 uppercase">Tidak Ada Alumni</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-semibold">
              Tidak ada data alumni yang cocok dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {currentAlumni.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAlumni(item)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm p-3 flex flex-col justify-between border border-slate-200 group hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                    {item.foto ? (
                      <img 
                        src={item.foto} 
                        alt={item.nama} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                        <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center px-1 pb-1">
                    <h3 className="text-[10px] font-black text-[#280f91] uppercase tracking-tight line-clamp-1">
                      {item.nama}
                    </h3>
                    <p className="text-[8px] font-bold text-[#ff6105] uppercase tracking-wider line-clamp-1 mt-0.5">
                      {item.pekerjaan || "Alumni"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl bg-white text-purple-900 border border-slate-200 font-bold text-xs h-10 px-4 cursor-pointer"
                >
                  Sebelumnya
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, array) => (
                  <div key={page} className="flex items-center gap-1">
                    {index > 0 && array[index - 1] !== page - 1 && <span className="text-slate-400 px-1">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                        currentPage === page
                          ? "bg-[#280f91] text-white shadow-md"
                          : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl bg-white text-purple-900 border border-slate-200 font-bold text-xs h-10 px-4 cursor-pointer"
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Detailed Modal Popup */}
        <Dialog open={!!selectedAlumni} onOpenChange={(open) => !open && setSelectedAlumni(null)}>
          <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
            {selectedAlumni && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-[#ff6105]" /> Detail Profil Alumni
                  </DialogTitle>
                </DialogHeader>

                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Photo Column */}
                  <div className="sm:col-span-1 space-y-4">
                    <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                      {selectedAlumni.foto ? (
                        <img 
                          src={selectedAlumni.foto} 
                          alt={selectedAlumni.nama}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                          No Photo
                        </div>
                      )}
                    </div>
                    <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 text-center space-y-1">
                      <span className="block text-[9px] font-black text-purple-400 uppercase tracking-wider">Tahun Lulus</span>
                      <span className="text-xs font-black text-purple-900">{selectedAlumni.lulusTahun || "-"}</span>
                    </div>
                  </div>

                  {/* Fields Column */}
                  <div className="sm:col-span-2 space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{selectedAlumni.nama}</h2>
                      <span className="inline-block bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                        {selectedAlumni.pekerjaan || "Alumni PKBM"}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Pekerjaan Saat Ini
                          </span>
                          <span className="text-slate-800 font-bold uppercase">{selectedAlumni.pekerjaan || "-"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Pendidikan Lanjut
                          </span>
                          <span className="text-slate-800 font-bold uppercase">{selectedAlumni.pendidikanLanjut || "-"}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block not-italic mb-1">Pesan / Kesan:</span>
                        <p className="text-slate-600 font-semibold leading-relaxed">
                          "{selectedAlumni.testimoni || "Pendidikan di PKBM Menuju Makmur memberikan saya kesempatan kedua untuk meraih masa depan yang lebih cerah. Terima kasih kepada seluruh tutor dan staf atas bimbingannya."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-4">
                  <DialogClose asChild>
                    <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                      Tutup
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
