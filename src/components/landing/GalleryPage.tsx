import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, ChevronLeft } from "lucide-react";

const GALLERY_CATEGORIES = [
  { id: "KEGIATAN PEMBELAJARAN", label: "KEGIATAN PEMBELAJARAN", color: "from-purple-900 to-indigo-900" },
  { id: "KEGIATAN KURSUS DAN PELATIHAN", label: "KEGIATAN KURSUS DAN PELATIHAN", color: "from-blue-900 to-cyan-900" },
  { id: "KEGIATAN LUAR KELAS", label: "KEGIATAN LUAR KELAS", color: "from-teal-900 to-emerald-900" },
  { id: "KEGIATAN UJIAN", label: "KEGIATAN UJIAN", color: "from-orange-900 to-amber-900" },
  { id: "KEGIATAN PENGABDIAN MASYARAKAT DAN LINGKUNGAN", label: "KEGIATAN PENGABDIAN MASYARAKAT DAN LINGKUNGAN", color: "from-green-900 to-lime-900" },
  { id: "KEGIATAN LEMBAGA", label: "KEGIATAN LEMBAGA", color: "from-pink-900 to-rose-900" },
  { id: "KEGIATAN LOMBA", label: "KEGIATAN LOMBA", color: "from-violet-900 to-purple-900" },
  { id: "KEGIATAN LAINNYA", label: "KEGIATAN LAINNYA", color: "from-slate-800 to-slate-900" },
];

interface GalleryItem {
  id: number;
  namaFile: string;
  kategori: string;
  tanggalPosting: string;
  foto: string;
  status: string;
}

interface GalleryPageProps {
  onNavigate?: (path: string) => void;
}

// Placeholder cloud SVG for categories with no photo
function PlaceholderImage({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-end justify-end bg-gradient-to-br ${colorClass} relative`}>
      {/* Sky */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="200" fill="#87CEEB" />
        {/* Clouds */}
        <ellipse cx="60" cy="70" rx="35" ry="20" fill="white" opacity="0.8" />
        <ellipse cx="80" cy="60" rx="28" ry="18" fill="white" opacity="0.9" />
        <ellipse cx="40" cy="75" rx="22" ry="14" fill="white" opacity="0.7" />
        <ellipse cx="140" cy="50" rx="32" ry="18" fill="white" opacity="0.75" />
        <ellipse cx="158" cy="43" rx="24" ry="15" fill="white" opacity="0.85" />
        {/* Hills */}
        <ellipse cx="60" cy="210" rx="80" ry="60" fill="#4a7c59" />
        <ellipse cx="160" cy="220" rx="80" ry="55" fill="#5a9e6f" />
      </svg>
      {/* Overlay for text */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
        <h3 className="text-[10px] sm:text-xs font-black text-[#0ff60a] uppercase tracking-wide text-center leading-tight">
          {label}
        </h3>
      </div>
    </div>
  );
}

export default function GalleryPage(_props: GalleryPageProps) {
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: "categories" | "photos" (viewing photos in a category)
  const [viewMode, setViewMode] = useState<"categories" | "photos">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Search state (for photo view)
  const [searchTerm, setSearchTerm] = useState("");

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryItem | null>(null);

  // Pagination (for photos inside category)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/gallery", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setGalleryList(data.data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to fetch gallery:", err);
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Get representative photo for each category
  const getCategoryPhoto = (categoryId: string) => {
    const items = galleryList.filter((g) => g.kategori === categoryId);
    return items.length > 0 ? items[0].foto : null;
  };

  // Get count for each category
  const getCategoryCount = (categoryId: string) => {
    return galleryList.filter((g) => g.kategori === categoryId).length;
  };

  // Photos in selected category
  const categoryPhotos = galleryList.filter((item) => {
    const matchCategory = item.kategori === selectedCategory;
    const matchSearch = item.namaFile.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalPages = Math.ceil(categoryPhotos.length / itemsPerPage) || 1;
  const currentPhotos = categoryPhotos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode("photos");
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <section id="galeri-landing" className="py-20 bg-[#b2ebf2] border-y border-slate-300 relative overflow-hidden min-h-[85vh] text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">



        {/* Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none text-[#280f91] uppercase drop-shadow-sm">
            GALERI
          </h2>
          {viewMode === "categories" ? (
            <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-3xl mx-auto text-center">
              Galeri PKBM Menuju Makmur menjadi tempat tersimpannya berbagai momen berharga yang menggambarkan semangat belajar, kebersamaan, dan perjalanan menuju masa depan yang lebih baik
            </p>
          ) : (
            <p className="text-slate-700 font-bold text-xs sm:text-sm text-center">
              {selectedCategory} — {categoryPhotos.length} Foto
            </p>
          )}
        </div>

        {/* === CATEGORY GRID VIEW === */}
        {viewMode === "categories" && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
              <p className="text-slate-500 font-bold text-sm">Memuat galeri...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {GALLERY_CATEGORIES.map((cat) => {
                const photo = getCategoryPhoto(cat.id);
                const count = getCategoryCount(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className="rounded-3xl overflow-hidden border-4 border-[#280f91]/60 bg-[#20108a] shadow-2xl cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {photo ? (
                      <div className="w-full h-full relative">
                        <img
                          src={photo}
                          alt={cat.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                          <p className="text-[10px] font-black text-[#0ff60a] uppercase tracking-wide text-center leading-tight">
                            {cat.label}
                          </p>
                          {count > 0 && (
                            <p className="text-[9px] text-white/60 font-bold text-center mt-0.5">{count} foto</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <PlaceholderImage label={cat.label} colorClass={cat.color} />
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* === PHOTOS VIEW (inside a category) === */}
        {viewMode === "photos" && (
          <div className="space-y-8">
            {/* Search inside category */}
            <div className="max-w-xl mx-auto relative">
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-white text-slate-700 text-sm font-semibold pl-12 pr-4 py-3.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md placeholder-slate-400"
                  placeholder="Cari nama foto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              </div>
            </div>

            {categoryPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white/60 border-2 border-dashed border-purple-200 rounded-3xl max-w-3xl mx-auto">
                <p className="text-sm font-black text-slate-800 uppercase">Belum Ada Foto</p>
                <p className="text-xs text-slate-500 mt-1">Belum ada foto untuk kategori ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                  {currentPhotos.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxPhoto(item)}
                      className="bg-[#20108a] rounded-2xl overflow-hidden shadow-xl border border-blue-900/30 group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      style={{ aspectRatio: "3/4" }}
                    >
                      <div className="relative w-full h-full">
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.namaFile}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-white/20">
                            <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                            </svg>
                          </div>
                        )}
                        {/* Text overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5">
                          <p className="text-[10px] font-black text-[#0ff60a] uppercase tracking-wide line-clamp-2 leading-tight">
                            {item.namaFile}
                          </p>
                          <p className="text-[9px] text-white/60 mt-0.5">{item.tanggalPosting}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-6">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold text-xs h-9 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="bg-white/80 border border-purple-100 text-[#280f91] font-black text-xs px-3.5 py-2 rounded-xl">
                      {currentPage} / {totalPages}
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
          </div>
        )}

        {/* Photo Lightbox Dialog */}
        <Dialog open={lightboxPhoto !== null} onOpenChange={(open) => { if (!open) setLightboxPhoto(null); }}>
          <DialogContent className="sm:max-w-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 rounded-3xl text-left overflow-y-auto max-h-[90vh]">
            {lightboxPhoto && (
              <>
                <DialogHeader className="border-b border-white/10 pb-3">
                  <DialogTitle className="text-sm font-black text-white uppercase flex items-center gap-2">
                    <span className="text-[#0ff60a]">{lightboxPhoto.kategori}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="py-3">
                  {lightboxPhoto.foto && (
                    <img
                      src={lightboxPhoto.foto}
                      alt={lightboxPhoto.namaFile}
                      className="w-full max-h-[60vh] object-contain rounded-2xl bg-black"
                    />
                  )}
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-black text-white">{lightboxPhoto.namaFile}</p>
                    <p className="text-xs text-slate-400 font-semibold">{lightboxPhoto.tanggalPosting}</p>
                  </div>
                </div>
                <DialogFooter className="border-t border-white/10 pt-3 mt-1">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl font-bold cursor-pointer text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
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
