import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Download, ShieldAlert, Home, MapPin, Mail } from "lucide-react";

interface DownloadItem {
  id: number;
  namaFile: string;
  kategori: string;
  fileUrl: string;
  hits: number;
  status: string;
  tanggalUpload: string;
}

interface DownloadPageProps {
  onNavigate?: (path: string) => void;
}

const STATIC_CATEGORIES = [
  { name: "MODUL PEMBELAJARAN", key: "MODUL PEMBELAJARAN" },
  { name: "ADMINISTRASI KURIKULUM", key: "ADMINISTRASI KURIKULUM" },
  { name: "ADMINISTRASI TUTOR", key: "ADMINISTRASI TUTOR" },
  { name: "ADMINISTRASI WB", key: "ADMINISTRASI WB" },
  { name: "ADMINISTRASI KELEMBAGAAN", key: "ADMINISTRASI KELEMBAGAAN" }
];

export default function DownloadPage({ onNavigate }: DownloadPageProps) {
  const [downloadsList, setDownloadsList] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetch("/api/downloads")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setDownloadsList(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch downloads:", err))
      .finally(() => setLoading(false));
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryFilter, itemsPerPage]);

  const handleDownloadClick = async (item: DownloadItem) => {
    try {
      // Increment hit count asynchronously in the background
      fetch(`/api/downloads/${item.id}/hit`, { method: "POST" })
        .then(() => {
          // Update local state hits
          setDownloadsList((prevList) =>
            prevList.map((d) => (d.id === item.id ? { ...d, hits: d.hits + 1 } : d))
          );
        })
        .catch((e) => console.error("Failed to increment hit:", e));
      
      // Direct file opening/downloading in new window
      window.open(item.fileUrl, "_blank");
    } catch (e) {
      console.error(e);
    }
  };

  // Filter downloads
  const filteredDownloads = downloadsList.filter((item) => {
    const matchesSearch = item.namaFile.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategoryFilter) {
      matchesCategory = item.kategori.toUpperCase() === selectedCategoryFilter.toUpperCase();
    }
    
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDownloads.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDownloads.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <section id="downloads-landing" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh] text-left">
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
            className="inline-flex items-center gap-2 text-xs font-black text-[#280f91] hover:text-[#ff6105] transition-colors uppercase tracking-widest cursor-pointer bg-white/80 hover:bg-white px-5 py-2.5 rounded-full shadow-xs border border-purple-100"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </button>
        </div>

        {/* Centered Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none text-[#280f91] uppercase drop-shadow-sm">
            DOWNLOAD
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-3xl mx-auto">
            Unduh berbagai dokumen administrasi PKBM Menuju Makmur dengan mudah untuk mendukung kebutuhan informasi dan kelengkapan administrasi
          </p>
        </div>

        {/* FIVE GREEN QUICK-FILTER BUTTON CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-10">
          {STATIC_CATEGORIES.map((cat) => {
            const isActive = selectedCategoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(isActive ? null : cat.key)}
                className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-md border cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-500 scale-102"
                    : "bg-[#00ff00] text-emerald-950 hover:bg-emerald-400 border-emerald-300"
                }`}
              >
                {/* Home/Icon style overlay */}
                <div className={`h-11 w-11 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                  isActive ? "bg-emerald-700 text-white" : "bg-emerald-800 text-[#00ff00]"
                }`}>
                  <Home className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase leading-snug">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* PINK NOTEBOOK CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10 items-stretch">
          
          {/* Note Card 1 */}
          <div className="bg-[#ffb3c1] rounded-3xl shadow-lg border border-[#ffa3b6] relative p-5 flex flex-col justify-center overflow-hidden min-h-[100px]">
            {/* Binder holes */}
            <div className="flex justify-center gap-5 -mt-3.5 mb-2.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-800 border border-white"></div>
                  <div className="h-2 w-1 bg-slate-400/40 -mt-0.5 rounded-b-md"></div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-center text-[#7d0022]">
              <p className="text-[10px] font-black tracking-wider uppercase">
                Catatan : di klik otomatis short kategori dokumen
              </p>
              <p className="text-[9px] font-bold opacity-80">
                jenis statis tidak bisa ditambah kategori
              </p>
            </div>
          </div>

          {/* Spacer / Invisible element for center */}
          <div className="hidden md:block"></div>

          {/* Note Card 2 */}
          <div className="bg-[#ffb3c1] rounded-3xl shadow-lg border border-[#ffa3b6] relative p-5 flex flex-col justify-center overflow-hidden min-h-[100px]">
            {/* Binder holes */}
            <div className="flex justify-center gap-5 -mt-3.5 mb-2.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-800 border border-white"></div>
                  <div className="h-2 w-1 bg-slate-400/40 -mt-0.5 rounded-b-md"></div>
                </div>
              ))}
            </div>
            <div className="text-center text-[#7d0022] text-[10px] font-black tracking-wider uppercase">
              Catatan : banyaknya menyesuaikan
            </div>
          </div>

        </div>

        {/* DATA TABLE WRAPPER */}
        <div className="max-w-5xl mx-auto bg-white/95 rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Table Header controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Show Entries entries limit dropdown */}
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-9 px-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Cari search box */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>

          </div>

          {/* TABLE DISPLAY */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
              <span className="text-xs font-extrabold text-[#280f91] uppercase tracking-widest">Memuat berkas download...</span>
            </div>
          ) : currentItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-purple-100 border-b border-slate-200 text-slate-700 font-black uppercase">
                    <th className="py-4 px-6 text-center w-14">NO</th>
                    <th className="py-4 px-6">NAMA FILE</th>
                    <th className="py-4 px-6">TANGGAL UPLOAD</th>
                    <th className="py-4 px-6">KATEGORI</th>
                    <th className="py-4 px-6 text-center w-32">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-cyan-50/20">
                  {currentItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-cyan-50/40 transition-colors">
                      <td className="py-4 px-6 text-center text-slate-400 font-mono">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-900 font-extrabold">
                        {item.namaFile}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {item.tanggalUpload}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-3 py-0.5 text-[9px] font-black text-purple-700 uppercase tracking-wide">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Button
                          onClick={() => handleDownloadClick(item)}
                          className="rounded-xl bg-amber-400 hover:bg-amber-500 hover:scale-103 active:scale-97 text-slate-900 font-black text-[10px] tracking-wider uppercase h-9 px-4 cursor-pointer transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDownloads.length)} of {filteredDownloads.length} entries
                </span>

                {totalPages > 1 && (
                  <div className="flex gap-1.5">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-[10px] uppercase h-9 px-4.5 cursor-pointer disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${
                          currentPage === page
                            ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-400/20"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-[10px] uppercase h-9 px-4.5 cursor-pointer disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-14 text-center space-y-3">
              <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto border border-purple-100">
                <ShieldAlert className="h-7 w-7 text-purple-650" />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase">Tidak Ada Data Dokumen</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tidak ada dokumen yang cocok dengan kata kunci atau kategori pencarian Anda.
              </p>
            </div>
          )}

        </div>

        {/* DATANG & KUNJUNGI INFO SECTIONS AT THE BOTTOM OF THE PAGE */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/80 p-8 rounded-3xl border border-slate-200/50 shadow-lg text-slate-700 font-semibold">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#280f91]">Datang & Kunjungi</h3>
              <h2 className="text-3xl font-black text-[#00c800] uppercase tracking-tight">PKBM MENUJU MAKMUR</h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-2.5 font-bold">
                Kami siap memberikan informasi dan pelayanan kepada siswa, orang tua, serta masyarakat pada jam kerja. Silakan hubungi kami melalui kontak di bawah ini.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#280f91] uppercase">Alamat Lengkap</h4>
                  <p className="text-[11px] font-bold text-slate-600 mt-0.5 leading-normal">
                    Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara Kecamatan Jatinagara Kab. Ciamis Prov. Jawa Barat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#280f91] uppercase">Kontak Resmi</h4>
                  <a href="mailto:admin@pkbmmenujumakmur.sch.id" className="text-[11px] font-bold text-[#ff6105] hover:underline block mt-0.5">
                    admin@pkbmmenujumakmur.sch.id
                  </a>
                  <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                    0821 2859 4025
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Visual Map Skeleton Layout */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50 flex items-center justify-center group shadow-md">
            <svg className="w-full h-full text-slate-200 bg-cyan-50/50" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#E2F0F9"/>
              <path d="M0 80C100 80 120 180 220 180C320 180 340 50 400 50" stroke="#CBDCE7" strokeWidth="24" strokeLinecap="round"/>
              <path d="M120 0C120 100 240 120 240 220C240 320 380 300 400 300" stroke="#CBDCE7" strokeWidth="16" strokeLinecap="round"/>
              <path d="M0 240C150 240 200 150 400 150" stroke="#CBDCE7" strokeWidth="20" strokeLinecap="round"/>
              
              <path d="M0 80C100 80 120 180 220 180C320 180 340 50 400 50" stroke="#FFF" strokeWidth="2" strokeDasharray="6 6"/>
              <path d="M120 0C120 100 240 120 240 220C240 320 380 300 400 300" stroke="#FFF" strokeWidth="2" strokeDasharray="6 6"/>
              <path d="M0 240C150 240 200 150 400 150" stroke="#FFF" strokeWidth="2" strokeDasharray="6 6"/>
              
              <circle cx="220" cy="180" r="10" fill="#FF5252" stroke="#FFF" strokeWidth="2"/>
              <circle cx="220" cy="180" r="18" fill="#FF5252" fillOpacity="0.2" className="animate-ping"/>
            </svg>
            <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-slate-900 text-white font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                Klik Untuk Petunjuk Arah
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
