import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AlumniItem {
  id: number;
  nama: string;
  program: string;
  tahunLulus: string;
  cerita: string;
  foto: string;
}

interface TestimonialsProps {
  onNavigate?: (path: string) => void;
}

export default function Testimonials({ onNavigate }: TestimonialsProps) {
  const [testimonials, setTestimonials] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/alumni", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const withStory = data.data.filter((item: AlumniItem) => item.cerita?.trim());
          withStory.reverse();
          setTestimonials(withStory.slice(0, 9));
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Gagal ambil data testimoni:", err);
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

  const displayItems = testimonials.slice(0, 5);

  return (
    <section id="alumni" className="pt-8 pb-16 bg-white relative">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Cerita Alumni
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">CERITA</span>{" "}
            <span className="text-[#ff6105]">ALUMNI</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Setiap alumni memiliki kisah perjuangan dan keberhasilan yang berbeda. Melalui semangat belajar, kerja keras, dan kesempatan yang didapat di PKBM Menuju Makmur, mereka berhasil melangkah lebih dekat menuju cita-cita. Kini giliran Anda untuk memulai perjalanan dan menjadi bagian dari cerita sukses berikutnya
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#280f91]" />
          </div>
        ) : displayItems.length > 0 ? (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {displayItems.length > 1 && (
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
                  displayItems.length === 1 ? "justify-center" : ""
                }`}
              >
                {displayItems.map((t) => (
                  <Card
                    key={t.id}
                    data-card
                    className="snap-start shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] border border-slate-300 hover:border-[#ff6105] transition-all duration-300 flex flex-col justify-between bg-white relative p-6 rounded-3xl"
                  >
                    <span className="absolute top-4 right-6 text-5xl font-black text-slate-100 font-serif leading-none select-none">
                      &ldquo;
                    </span>

                    <div className="space-y-3 relative z-10 flex-1">
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed italic line-clamp-6">
                        &ldquo;{t.cerita}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4 shrink-0 relative z-10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-md shadow-slate-200/20 shrink-0">
                        {t.foto ? (
                          <img
                            src={t.foto}
                            alt={t.nama}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-slate-400 uppercase">{t.nama.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#280f91] leading-tight truncate">{t.nama}</h4>
                        <span className="block text-[10px] font-bold text-[#ff6105] mt-0.5 truncate">{t.program} ({t.tahunLulus})</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-center flex justify-center">
              <Button
                onClick={() => {
                  window.history.pushState({}, "", "/alumni");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer"
              >
                Lihat Selengkapnya
              </Button>
            </div>
          </div>
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto">
            Tidak ada data testimoni saat ini.
          </div>
        )}
      </div>
    </section>
  );
}
