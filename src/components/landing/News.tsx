import { useState, useEffect } from "react";
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
import { Calendar, ShieldAlert, Search, ChevronRight } from "lucide-react";

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

  // Limit homepage news list to 3 items
  const displayNews = isDetailed ? filteredNews : filteredNews.slice(0, 3);

  // DETAILED FULL NEWS PAGE VIEW (Halaman Menu Berita)
  if (isDetailed) {
    return (
      <section id="berita" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          


          {/* Centered purple-green Title */}
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center leading-none">
              <span className="text-[#9c27b0] font-black drop-shadow-sm">
                BERITA
              </span>{" "}
              <span className="text-[#0ff60a] font-black drop-shadow-xs">
                PKBM MENUJU MAKMUR
              </span>
            </h2>
            <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-2xl mx-auto">
              Berita PKBM Menuju Makmur menyajikan informasi mengenai kegiatan, program, pencapaian, dan perkembangan terbaru sebagai bagian dari upaya meningkatkan kualitas pendidikan
            </p>
          </div>

          {/* Search bar inside detailed news */}
          <div className="relative max-w-md mx-auto mb-10">
            <input
              type="text"
              placeholder="cari judul atau kategori berita"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-5 pr-12 text-sm font-semibold border-none rounded-full bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md placeholder-slate-400"
            />
            <Search className="absolute right-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          </div>

          {/* SIDEWAYS SCROLLABLE FILTER BAR */}
          <div className="max-w-5xl mx-auto mb-12 flex items-center justify-between gap-3 bg-white/40 backdrop-blur-xs p-3 rounded-3xl border border-white/20 shadow-xs">
            <div className="flex-1 flex gap-2.5 overflow-x-auto whitespace-nowrap py-1.5 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("SEMUA")}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none shrink-0 ${
                  selectedCategory === "SEMUA"
                    ? "bg-[#9c27b0] text-white shadow-md shadow-purple-550/20"
                    : "bg-white/70 hover:bg-white text-purple-950 border border-purple-100"
                }`}
              >
                SEMUA
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.nama)}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none shrink-0 ${
                    selectedCategory === cat.nama
                      ? "bg-[#9c27b0] text-white shadow-md shadow-purple-550/20"
                      : "bg-white/70 hover:bg-white text-purple-950 border border-purple-100"
                  }`}
                >
                  {cat.nama}
                </button>
              ))}
            </div>
            {/* Orange chevron right indicator as in mockup */}
            <div className="flex items-center text-[#ff6105] font-black text-lg select-none px-2 pr-3 cursor-default shrink-0" title="Geser untuk kategori lainnya">
              &gt;&gt;&gt;
            </div>
          </div>

          {/* NEWS GRID (3 Column Cards vertical) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
              <span className="text-sm font-bold text-[#9c27b0] uppercase tracking-widest">Memuat Berita...</span>
            </div>
          ) : displayNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {displayNews.map((news) => (
                <Dialog key={news.id}>
                  <DialogTrigger asChild>
                    <div 
                      onClick={() => incrementHits(news.id)}
                      className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                    >
                      {/* Top part: Image + Category overlay */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-blue-950">
                        {news.foto ? (
                          <img 
                            src={news.foto} 
                            alt={news.judul} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex items-center justify-center text-white/20">
                            <Calendar className="h-12 w-12" />
                          </div>
                        )}

                        {/* Category tag overlay on top left */}
                        <div className="absolute top-4 left-4 z-10">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-full uppercase shadow-md tracking-wider">
                            {news.kategori}
                          </span>
                        </div>
                      </div>

                      {/* Bottom part: Title + Excerpt + link */}
                      <div className="space-y-3 text-left px-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-base font-black text-[#00ff00] leading-tight uppercase line-clamp-2">
                            {news.judul}
                          </h3>
                          <p className="text-white/80 text-xs font-semibold leading-relaxed line-clamp-3">
                            {news.konten}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[9px] text-[#00ff00] font-black uppercase tracking-wider mt-3">
                          <span className="hover:underline">SELENGKAPNYA &gt;&gt;&gt;</span>
                          <span className="text-white/50">{news.tanggalPosting}</span>
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
                        {news.foto ? (
                          <img 
                            src={news.foto} 
                            alt={news.judul}
                            className="w-full h-full object-cover" 
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
          ) : (
            <div className="max-w-md mx-auto bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200">
              <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="h-8 w-8 text-orange-600" />
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

  // DEFAULT HOMEPAGE KABAR TERKINI VIEW
  return (
    <section id="berita" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered purple-green Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center leading-none">
            <span className="text-[#9c27b0] font-black drop-shadow-sm">
              BERITA
            </span>{" "}
            <span className="text-[#0ff60a] font-black drop-shadow-xs">
              PKBM MENUJU MAKMUR
            </span>
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-2xl mx-auto">
            Berita PKBM Menuju Makmur menyajikan informasi mengenai kegiatan, program, pencapaian, dan perkembangan terbaru sebagai bagian dari upaya meningkatkan kualitas pendidikan
          </p>
        </div>

        {/* Dynamic News Grid on homepage */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#280f91] border-t-transparent" />
            <span className="text-sm font-bold text-[#280f91] uppercase tracking-widest">Memuat Berita...</span>
          </div>
        ) : displayNews.length > 0 ? (
          <div className="space-y-12 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayNews.map((news) => (
                <Dialog key={news.id}>
                  <DialogTrigger asChild>
                    <div 
                      onClick={() => incrementHits(news.id)}
                      className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-left"
                    >
                      {/* Top part: Image + Category overlay */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-blue-950">
                        {news.foto ? (
                          <img 
                            src={news.foto} 
                            alt={news.judul} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex items-center justify-center text-white/20">
                            <Calendar className="h-12 w-12" />
                          </div>
                        )}

                        {/* Category tag overlay on top left */}
                        <div className="absolute top-4 left-4 z-10">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-full uppercase shadow-md tracking-wider">
                            {news.kategori}
                          </span>
                        </div>
                      </div>

                      {/* Bottom part: Title + Excerpt + link */}
                      <div className="space-y-3 text-left px-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-base font-black text-[#00ff00] leading-tight uppercase line-clamp-2">
                            {news.judul}
                          </h3>
                          <p className="text-white/80 text-xs font-semibold leading-relaxed line-clamp-3">
                            {news.konten}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[9px] text-[#00ff00] font-black uppercase tracking-wider mt-3">
                          <span className="hover:underline">SELENGKAPNYA &gt;&gt;&gt;</span>
                          <span className="text-white/50">{news.tanggalPosting}</span>
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
                        {news.foto ? (
                          <img 
                            src={news.foto} 
                            alt={news.judul}
                            className="w-full h-full object-cover" 
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

            {/* Custom pill-style READ MORE button */}
            {newsList.length > 0 && (
              <div className="text-center mt-12 flex justify-center">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate("/news");
                    } else {
                      window.history.pushState({}, "", "/news");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }
                  }}
                  className="inline-flex items-center bg-[#a8e0ea] hover:bg-[#8fd0dc] text-black font-black text-lg py-2.5 pl-2.5 pr-8 rounded-full border-4 border-black shadow-lg transition-all active:scale-95 cursor-pointer hover:shadow-black/20"
                >
                  <div className="h-11 w-11 rounded-full bg-black flex items-center justify-center text-white shrink-0 mr-4">
                    <ChevronRight className="h-6 w-6 stroke-[3]" />
                  </div>
                  <span className="tracking-wide uppercase text-sm font-black">READ MORE</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-[#20108a] rounded-3xl p-8 text-center space-y-4 shadow-xl border border-blue-900/30">
            <div className="h-16 w-16 bg-[#00ff00]/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-[#00ff00]" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Belum Ada Berita</h3>
            <p className="text-white/70 font-bold text-xs">
              Kabar berita terbaru saat ini belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
