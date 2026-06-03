import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ArrowLeft, Search, Award, Sparkles } from "lucide-react";

interface AlumniItem {
  id: number;
  nama: string;
  program: string;
  tahunLulus: string;
  cerita: string;
  foto: string;
}

interface AlumniPageProps {
  onNavigate?: (path: string) => void;
}

export default function AlumniPage({ onNavigate }: AlumniPageProps) {
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Popup state
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/alumni", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAlumniList(data.data);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch alumni list:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredAlumni = alumniList.filter((item) =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlumni = filteredAlumni.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <section id="alumni-landing" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh] text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back Button */}
        <div className="mb-8 text-left max-w-5xl mx-auto">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate("/");
              } else {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-black text-purple-700 hover:text-orange-600 transition-colors uppercase tracking-widest cursor-pointer bg-white/80 hover:bg-white px-5 py-2.5 rounded-full shadow-sm border border-purple-100"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </button>
        </div>

        {/* Centered Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none text-[#280f91] uppercase drop-shadow-sm">
            ALUMNI PKBM MENUJU MAKMUR
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-3xl mx-auto text-center">
            Alumni PKBM Menuju Makmur adalah bukti nyata bahwa pendidikan membuka jalan menuju masa depan yang lebih baik. Dengan semangat belajar dan tekad yang kuat, mereka berhasil meraih berbagai pencapaian. Kini saatnya Anda memulai perjalanan dan menjadi bagian dari kisah sukses berikutnya.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 relative">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-white text-slate-700 text-sm font-semibold pl-12 pr-4 py-3.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md placeholder-slate-400"
              placeholder="Cari nama alumni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          </div>
        </div>

        {/* Alumni Cards Grid */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {currentAlumni.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAlumni(item)}
                  className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-blue-950 mb-1 border border-blue-900/20">
                    {item.foto ? (
                      <img 
                        src={item.foto} 
                        alt={item.nama} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-purple-850 flex flex-col items-center justify-center text-white/20">
                        <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}

                    {/* Program overlay tag (top-left) */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className={`inline-block text-white font-extrabold text-[8px] px-2.5 py-1 rounded-full uppercase shadow-md tracking-wider ${
                        item.program.includes("C") ? "bg-[#ffb300]" : item.program.includes("B") ? "bg-blue-600" : "bg-emerald-600"
                      }`}>
                        {item.program}
                      </span>
                    </div>

                    {/* Text Overlay inside photo at the bottom (Bright Neon Green) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 text-left">
                      <h3 className="text-xs font-black text-[#0ff60a] uppercase tracking-wide line-clamp-1">
                        {item.nama}
                      </h3>
                      <p className="text-[10px] font-bold text-[#0ff60a] uppercase tracking-wider line-clamp-1 mt-0.5">
                        Lulus {item.tahunLulus}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 max-w-5xl mx-auto">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold text-xs h-9 cursor-pointer"
                >
                  Previous
                </Button>
                <span className="bg-white/80 border border-purple-100 text-[#280f91] font-black text-xs px-3.5 py-2 rounded-xl">
                  {currentPage}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold text-xs h-9 cursor-pointer"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success Stories Details Dialog Popup */}
        <Dialog open={selectedAlumni !== null} onOpenChange={(open) => { if (!open) setSelectedAlumni(null); }}>
          <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
            {selectedAlumni && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#ff6105]" /> Kisah Sukses Alumni
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
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-200/50">
                          <svg className="w-12 h-12 opacity-35" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          <span className="text-[10px] font-bold mt-1">FOTO</span>
                        </div>
                      )}
                    </div>
                    <span className="block text-center text-xs font-black uppercase text-[#ff6105] bg-orange-50 border border-orange-200 py-1.5 rounded-xl">
                      {selectedAlumni.program}
                    </span>
                  </div>

                  {/* Profile Details Column */}
                  <div className="sm:col-span-2 space-y-4 text-slate-700 font-semibold">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xl font-black text-[#280f91]">{selectedAlumni.nama}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Lulus Tahun Pendidikan {selectedAlumni.tahunLulus}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Program Pendidikan</span>
                        <span className="text-[#280f91] font-black">{selectedAlumni.program}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tahun Lulus</span>
                        <span className="text-slate-800 font-black">{selectedAlumni.tahunLulus}</span>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100/50 flex items-start gap-3 mt-2">
                      <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-purple-400 font-extrabold block uppercase tracking-wider mb-1">Cerita Sukses Alumni</span>
                        <p className="text-[11px] font-bold text-purple-900 leading-normal italic">
                          "{selectedAlumni.cerita || 'Belajar dengan sungguh-sungguh untuk masa depan yang lebih cerah.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex sm:justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl font-bold cursor-pointer text-xs">Tutup</Button>
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
