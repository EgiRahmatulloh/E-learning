import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, ChevronLeft } from "lucide-react";
import PhotoCarousel from "@/components/ui/PhotoCarousel";
import { parsePhotos } from "@/lib/photos";

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
function PlaceholderImage({ colorClass }: { label: string; colorClass: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${colorClass} relative overflow-hidden`} title="Belum Ada Foto">
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
    return items.length > 0 ? parsePhotos(items[0].foto)[0] : null;
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
    <section id="galeri-landing" className="pt-6 pb-12 bg-white border-y border-slate-300 relative overflow-hidden min-h-[85vh] text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">



        {/* Title */}
        <div className="text-center space-y-4 mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block mb-2">DOKUMENTASI KEGIATAN</span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none uppercase drop-shadow-sm">
            <span className="text-[#280f91]">GALERI</span> <span className="text-[#ff6105]">KEGIATAN</span>
          </h2>
          {viewMode === "categories" ? (
            <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 tracking-tighter text-center">
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
                    className="rounded-3xl overflow-hidden border border-slate-200 bg-white p-3 shadow-sm cursor-pointer group hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative flex flex-col"
                  >
                    <div className="w-full relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 mb-3">
                      {photo ? (
                        <img
                          src={photo}
                          alt={cat.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <PlaceholderImage label={cat.label} colorClass={cat.color} />
                      )}
                    </div>
                    <div className="text-center px-1 pb-2">
                      <p className="text-[10px] font-black text-[#280f91] uppercase tracking-wide leading-tight">
                        {cat.label}
                      </p>
                      {count > 0 && (
                        <p className="text-[9px] text-[#ff6105] font-bold mt-1">{count} foto</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* === PHOTOS VIEW (inside a category) === */}
        {viewMode === "photos" && (
          <div className="space-y-8">
            {/* Action Bar: Back Button & Search inside category */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 max-w-5xl mx-auto">
              {/* Left Column: Back Button */}
              <div className="flex justify-start order-2 md:order-1">
                <Button
                  onClick={() => setViewMode("categories")}
                  className="w-full md:w-auto rounded-2xl bg-[#280f91] hover:bg-[#ff6105] text-white font-extrabold text-xs px-6 py-3.5 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="h-4.5 w-4.5" /> KEMBALI
                </Button>
              </div>
              
              {/* Center Column: Search (Centered) */}
              <div className="w-full relative order-1 md:order-2">
                <input
                  type="text"
                  className="w-full bg-white text-slate-700 text-sm font-semibold pl-12 pr-4 py-3.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md placeholder-slate-400"
                  placeholder="Cari nama foto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              </div>

              {/* Right Column: Empty space for symmetry */}
              <div className="hidden md:block order-3" />
            </div>

            {categoryPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white/60 border-2 border-dashed border-purple-200 rounded-3xl max-w-3xl mx-auto">
                <p className="text-sm font-black text-slate-800 uppercase">Belum Ada Foto</p>
                <p className="text-xs text-slate-500 mt-1">Belum ada foto untuk kategori ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
                  {currentPhotos.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxPhoto(item)}
                      className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 p-3 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-2 border border-slate-100">
                        {parsePhotos(item.foto).length > 0 ? (
                          <img
                            src={parsePhotos(item.foto)[0]}
                            alt={item.namaFile}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                            </svg>
                          </div>
                        )}
                        {parsePhotos(item.foto).length > 1 && (
                          <span className="absolute top-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-black text-white">
                            {parsePhotos(item.foto).length} foto
                          </span>
                        )}
                      </div>
                      <div className="text-center px-1 pb-1">
                        <p className="text-[10px] font-black text-[#280f91] uppercase tracking-wide line-clamp-2 leading-tight">
                          {item.namaFile}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">{item.tanggalPosting}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl bg-white text-purple-900 border border-slate-200 font-bold text-xs h-10 px-4 cursor-pointer"
                    >
                      Sebelumnya
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                          currentPage === page
                            ? "bg-[#280f91] text-white shadow-md"
                            : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {page}
                      </button>
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
          </div>
        )}

        {/* Photo Lightbox Dialog - konsisten bg-white seperti Tutor/News */}
        <Dialog open={lightboxPhoto !== null} onOpenChange={(open) => { if (!open) setLightboxPhoto(null); }}>
          <DialogContent className="sm:max-w-3xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[90vh]">
            {lightboxPhoto && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="text-sm font-black text-[#280f91] uppercase flex items-center gap-2">
                    <span className="text-[#ff6105]">{lightboxPhoto.kategori}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {parsePhotos(lightboxPhoto.foto).length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <PhotoCarousel
                        photos={parsePhotos(lightboxPhoto.foto)}
                        alt={lightboxPhoto.namaFile}
                        imageClassName="max-h-[60vh] object-contain rounded-2xl"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900">{lightboxPhoto.namaFile}</p>
                    <p className="text-xs text-slate-500 font-semibold">{lightboxPhoto.tanggalPosting}</p>
                  </div>
                </div>
                <DialogFooter className="border-t border-slate-100 pt-4 mt-2 flex justify-end">
                  <DialogClose asChild>
                    <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 cursor-pointer">
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
