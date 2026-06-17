import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryApiItem {
  id: number;
  namaFile: string;
  kategori: string;
  tanggalPosting: string;
  foto: string;
  status: string;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/gallery", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setItems(data.data.slice(0, 5));
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to fetch gallery:", err);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 280;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section id="galeri" className="pt-8 pb-16 bg-white relative">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Galeri Kegiatan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">GALERI</span>{" "}
            <span className="text-[#ff6105]">PKBM MENUJU MAKMUR</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Galeri PKBM Menuju Makmur menjadi tempat tersimpannya berbagai momen berharga yang menggambarkan semangat belajar, kebersamaan, dan perjalanan menuju masa depan yang lebih baik
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6105]" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-400 text-sm font-bold py-12">Belum ada galeri.</p>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {items.length > 1 && (
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
                  items.length === 1 ? "justify-center" : ""
                }`}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    data-card
                    className="snap-start shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] group overflow-hidden rounded-2xl border border-slate-300 relative aspect-[4/3] bg-slate-100"
                  >
                    <img
                      src={item.foto}
                      alt={item.namaFile}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        <span className="block text-[10px] font-black tracking-widest text-[#ff6105] uppercase mb-1">{item.kategori}</span>
                        <span className="text-white font-bold text-sm leading-tight block">{item.namaFile}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center flex justify-center">
              <Button
                onClick={() => {
                  window.history.pushState({}, "", "/galeri");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer"
              >
                Lihat Selengkapnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
