import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Download, ShieldAlert, Home } from "lucide-react";

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
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            // Increment hit count asynchronously in the background
                            fetch(`/api/downloads/${item.id}/hit`, { method: "POST" })
                              .then(() => {
                                setDownloadsList((prevList) =>
                                  prevList.map((d) => (d.id === item.id ? { ...d, hits: d.hits + 1 } : d))
                                );
                              })
                              .catch((e) => console.error("Failed to increment hit:", e));
                          }}
                          className="rounded-xl bg-amber-400 hover:bg-amber-500 hover:scale-103 active:scale-97 text-slate-900 font-black text-[10px] tracking-wider uppercase h-9 px-4 cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto w-fit"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
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

      </div>
    </section>
  );
}
