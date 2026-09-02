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
import { Calendar, ShieldAlert, Search, ChevronRight, ChevronLeft } from "lucide-react";
import PhotoCarousel from "@/components/ui/PhotoCarousel";
import { parsePhotos } from "@/lib/photos";

interface NewsItem {
  id: number;
  judul: string;
  kategori: string;
  pembuat: string;
  tanggalPosting: string;
  hits: number;
  status: string;
  foto: string;
  konten: string;
}

interface NewsCategory {
  id: number;
  nama: string;
}

interface NewsProps {
  isDetailed?: boolean;
  onNavigate?: (path: string) => void;
}

export default function News({ isDetailed = false, onNavigate }: NewsProps) {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Fetch news and categories parallel
    Promise.all([
      fetch("/api/news").then((res) => res.json()),
      fetch("/api/news-categories").then((res) => res.json())
    ])
      .then(([newsData, catData]) => {
        if (newsData.success && newsData.data) {
          // Filter only published news
          setNewsList(newsData.data.filter((n: NewsItem) => n.status === "PUBLISH"));
        }
        if (catData.success && catData.data) {
          setCategories(catData.data);
        }
      })
      .catch((err) => console.error("Failed to fetch news data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Filtered news items
  const filteredNews = newsList.filter((item) => {
    const matchesCategory = selectedCategory === "SEMUA" || item.kategori === selectedCategory;
    const matchesSearch = 
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.konten.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Increment Hits Handler
  const incrementHits = async (id: number) => {
    try {
      const existingItem = newsList.find(n => n.id === id);
      if (!existingItem) return;
      
      const newHits = (existingItem.hits || 0) + 1;
      
      // Update locally
      setNewsList(prev => prev.map(n => n.id === id ? { ...n, hits: newHits } : n));
      
      // Send to server in background (silent update)
      fetch(`/api/news/${id}/hit`, {
        method: "POST"
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Limit homepage - 10 items, per view tetap 5 (20%) agar bisa digeser
  const displayNews = isDetailed ? filteredNews : filteredNews.slice(0, 10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 280;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  // DETAILED FULL NEWS PAGE VIEW (Halaman Menu Berita)
  if (isDetailed) {
    const totalPages = Math.ceil(filteredNews.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <section id="berita" className="pt-6 pb-12 bg-white relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

          {/* HEADER SECTION */}
          <div className="text-center mb-8 space-y-4 animate-in fade-in duration-700">
            <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block">
              SEPUTAR PKBM KAMI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight uppercase">
              BERITA <span className="text-[#ff6105]">DAN INFORMASI</span>
            </h2>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed tracking-tighter">
              Berita terbaru PKBM Menuju Makmur menyajikan informasi terbaru mengenai kegiatan, program, pencapaian, dan perkembangan terbaru sebagai bagian dari upaya meningkatkan kualitas pendidikan
            </p>
          </div>

          {/* FILTER CATEGORY + SEARCH BAR */}
          <div className="max-w-5xl mx-auto mb-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2.5 flex-wrap justify-center w-full md:w-auto">
              <button
                onClick={() => { setSelectedCategory("SEMUA"); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                  selectedCategory === "SEMUA"
                    ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.nama); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${
                    selectedCategory === cat.nama
                      ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.nama}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari judul atau isi berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#280f91]/30"
              />
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* NEWS GRID */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
              <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat Berita...</span>
            </div>
          ) : currentNews.length > 0 ? (
            <div className="space-y-10">
            <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
              {currentNews.map((news) => (
                <Dialog key={news.id}>
                  <DialogTrigger asChild>
                    <div 
                      onClick={() => incrementHits(news.id)}
                      className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-sm bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200 group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      {/* Image + Category overlay */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {parsePhotos(news.foto).length > 0 ? (
                          <img 
                            src={parsePhotos(news.foto)[0]} 
                            alt={news.judul} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Calendar className="h-12 w-12" />
                          </div>
                        )}

                        {parsePhotos(news.foto).length > 1 && (
                          <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-black text-white">
                            {parsePhotos(news.foto).length} foto
                          </span>
                        )}

                        {/* Category tag overlay */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full uppercase shadow-md tracking-wider">
                            {news.kategori}
                          </span>
                        </div>
                      </div>

                      {/* Title + Excerpt + link */}
                      <div className="p-4 space-y-3 text-left flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-[#280f91] transition-colors leading-tight uppercase line-clamp-2">
                            {news.judul}
                          </h3>
                          <p className="text-slate-600 text-xs font-semibold leading-relaxed line-clamp-3">
                            {news.konten}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-black uppercase tracking-wider">
                          <span className="group-hover:text-[#ff6105] transition-colors">SELENGKAPNYA &gt;&gt;</span>
                          <span className="text-slate-400">{news.tanggalPosting}</span>
                        </div>
                      </div>

                    </div>
                  </DialogTrigger>

                  {/* READ NEWS FULL POP-UP */}
                  <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left">
                    <DialogHeader>
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#9c27b0] uppercase tracking-wider mb-2">
                        <span>{news.kategori}</span>
                        <span>•</span>
                        <span>{news.tanggalPosting}</span>
                      </div>
                      <DialogTitle className="text-xl sm:text-2xl font-black text-[#280f91] leading-tight uppercase">
                        {news.judul}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                        {parsePhotos(news.foto).length > 0 ? (
                          <PhotoCarousel
                            photos={parsePhotos(news.foto)}
                            alt={news.judul}
                            imageClassName="h-56"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            No Photo
                          </div>
                        )}
                      </div>
                      <p className="text-slate-700 text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-1">
                        {news.konten}
                      </p>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>Penulis: {news.pembuat}</span>
                        <span>Dilihat: {news.hits} kali</span>
                      </div>
                    </div>
                    <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                      <DialogClose asChild>
                        <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 cursor-pointer">
                          Tutup Bacaan
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
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider">Belum Ada Berita</h3>
              <p className="text-slate-400 font-bold text-xs">
                Kabar berita terbaru saat ini belum tersedia.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }

  // DEFAULT HOMEPAGE KABAR TERKINI VIEW
  return (
    <section id="berita" className="pt-8 pb-16 bg-white relative overflow-hidden">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            SEPUTAR PKBM KAMI
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">BERITA</span>{" "}
            <span className="text-[#ff6105]">DAN INFORMASI</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed tracking-tighter">
            Berita PKBM Menuju Makmur menyajikan informasi mengenai kegiatan, program, pencapaian, dan perkembangan terbaru sebagai bagian dari upaya meningkatkan kualitas pendidikan.
          </p>
        </div>

        {/* Dynamic News Carousel on homepage */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
            <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat Berita...</span>
          </div>
        ) : displayNews.length > 0 ? (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {displayNews.length >= 6 && (
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
                  displayNews.length <= 4 ? "justify-center" : ""
                }`}
              >
                {displayNews.map((news) => (
                  <Dialog key={news.id}>
                    <DialogTrigger asChild>
                      <div
                        data-card
                        onClick={() => incrementHits(news.id)}
                        className="snap-start shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] bg-white rounded-3xl overflow-hidden p-4 flex flex-col justify-between border border-slate-300 group hover:border-[#ff6105] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-left"
                      >
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-50">
                          {parsePhotos(news.foto).length > 0 ? (
                            <img
                              src={parsePhotos(news.foto)[0]}
                              alt={news.judul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                              <Calendar className="h-12 w-12" />
                            </div>
                          )}

                          {parsePhotos(news.foto).length > 1 && (
                            <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-black text-white">
                              {parsePhotos(news.foto).length} foto
                            </span>
                          )}

                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85%] z-10 text-center">
                            <span className="inline-block w-full bg-[#9c27b0] text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full uppercase shadow-md tracking-wider">
                              {news.kategori}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 text-left px-1 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h3 className="text-sm font-black text-[#280f91] leading-tight uppercase line-clamp-2 group-hover:text-[#ff6105] transition-colors">
                              {news.judul}
                            </h3>
                            <p className="text-slate-600 text-[10px] font-semibold leading-relaxed line-clamp-3">
                              {news.konten}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[8px] text-slate-400 font-black uppercase tracking-wider mt-2">
                            <span className="hover:text-[#ff6105] transition-colors uppercase">SELENGKAPNYA &gt;&gt;</span>
                            <span className="text-slate-300">{news.tanggalPosting}</span>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>

                    {/* READ NEWS FULL POP-UP */}
                    <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left">
                      <DialogHeader>
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#9c27b0] uppercase tracking-wider mb-2">
                          <span>{news.kategori}</span>
                          <span>•</span>
                          <span>{news.tanggalPosting}</span>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-[#280f91] leading-tight uppercase">
                          {news.judul}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                          {parsePhotos(news.foto).length > 0 ? (
                            <PhotoCarousel
                              photos={parsePhotos(news.foto)}
                              alt={news.judul}
                              imageClassName="h-56"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-1">
                          {news.konten}
                        </p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pt-2 border-t border-slate-100">
                          <span>Penulis: {news.pembuat}</span>
                          <span>Dilihat: {news.hits} kali</span>
                        </div>
                      </div>
                      <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                        <DialogClose asChild>
                          <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 cursor-pointer">
                            Tutup Bacaan
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>

            {newsList.length > 0 && (
              <div className="text-center flex justify-center">
                <Button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate("/news");
                    } else {
                      window.history.pushState({}, "", "/news");
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
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Berita</h3>
            <p className="text-slate-500 font-bold text-xs">
              Kabar berita terbaru saat ini belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
