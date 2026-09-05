import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { MessageCircle, Sparkles, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { parsePhotos } from "@/lib/photos";
import PhotoCarousel from "@/components/ui/PhotoCarousel";

interface ProductItem {
  id: number;
  namaProduk: string;
  harga: number;
  penjual: string;
  satuan: string;
  status: string;
  deskripsi: string;
  noHp: string;
  gambar: string;
}

const formatHarga = (harga: number) =>
  `Rp ${harga.toLocaleString("id-ID")}`;

const formatWaNumber = (num: string) => {
  if (!num) return "";
  let clean = num.replace(/\D/g, "");
  if (clean.length < 9) return "";
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
};

const getWaLink = (item: ProductItem) => {
  const cleanNoHp = formatWaNumber(item.noHp);
  if (!cleanNoHp) return "#";
  const text = encodeURIComponent(
    `Halo ${item.penjual || "Penjual"}, saya tertarik membeli ${item.namaProduk || "produk"} karya Anda.`
  );
  return `https://wa.me/${cleanNoHp}?text=${text}`;
};

export default function Products() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data.filter((p: ProductItem) => p.status === "AKTIF"));
        }
      })
      .catch((err) => console.error("Gagal memuat produk:", err));
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 280;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section id="produk" className="pt-8 pb-16 bg-white relative overflow-hidden">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            KARYA & KREATIVITAS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
            <span className="text-[#280f91]">PRODUK HASIL</span>{" "}
            <span className="text-[#ff6105]">WARGA BELAJAR</span>
          </h2>
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed tracking-tighter">
            Dukung karya warga belajar PKBM Menuju Makmur dengan membeli produk hasil kreativitas mereka untuk mendorong kemandirian, semangat berwirausaha, dan masa depan yang lebih baik.
          </p>
        </div>

        {/* Products Carousel */}
        {products.length === 0 ? (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Produk</h3>
            <p className="text-slate-500 font-bold text-xs leading-relaxed">
              Produk hasil karya warga belajar saat ini belum dipublikasikan oleh administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {products.length >= 6 && (
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
                className={`flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-4 pb-4 ${products.length <= 4 ? "justify-center" : ""
                  }`}
              >
                {products.map((product) => (
                  <Dialog key={product.id}>
                    <DialogTrigger asChild>
                      <div
                        data-card
                        className="snap-start shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] bg-white rounded-3xl overflow-hidden p-4 flex flex-col justify-between border border-slate-300 group hover:border-[#ff6105] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-left min-h-[320px]"
                      >
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-100 shadow-inner">
                          {parsePhotos(product.gambar).length > 0 ? (
                            <img
                              src={parsePhotos(product.gambar)[0]}
                              alt={product.namaProduk}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                              <ShieldAlert className="h-8 w-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>

                          {parsePhotos(product.gambar).length > 1 && (
                            <span className="absolute top-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-black text-white">
                              {parsePhotos(product.gambar).length} foto
                            </span>
                          )}

                          <span className="absolute bottom-3 right-3 inline-block rounded-lg bg-[#ff6105] px-2.5 py-1 text-[11px] font-black text-white shadow-md">
                            {formatHarga(product.harga)}
                          </span>
                        </div>

                        <div className="space-y-3 text-left px-1 flex-1 flex flex-col justify-start">
                          <div className="space-y-2">
                            <h3 className="text-sm font-black text-[#280f91] group-hover:text-[#ff6105] transition-colors leading-tight line-clamp-2 uppercase break-words">
                              {product.namaProduk}
                            </h3>
                            <p className="text-slate-600 text-[10px] font-semibold leading-relaxed line-clamp-2 break-words">
                              {product.deskripsi}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={getWaLink(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] font-black text-emerald-600 hover:text-[#ff6105] uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              PESAN VIA WA &gt;&gt;
                            </a>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl flex flex-col">
                      <DialogHeader className="min-w-0 w-full shrink-0">
                        <DialogTitle className="text-2xl font-black text-[#280f91] break-words">{product.namaProduk}</DialogTitle>
                        <DialogDescription className="text-sm font-bold text-[#ff6105]">{formatHarga(product.harga)}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 min-w-0 w-full overflow-hidden flex-1">
                        <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200 bg-slate-100">
                          {parsePhotos(product.gambar).length > 0 ? (
                            <PhotoCarousel
                              photos={parsePhotos(product.gambar)}
                              alt={product.namaProduk}
                              imageClassName="h-56"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ShieldAlert className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm font-semibold leading-relaxed whitespace-pre-wrap break-all max-h-60 overflow-y-auto pr-1">
                          {product.deskripsi}
                        </p>
                        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-start gap-2.5">
                          <Sparkles className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold text-orange-900 leading-relaxed">
                            Produk ini dibuat langsung oleh kelompok wirausaha mandiri warga belajar PKBM Menuju Makmur untuk mendukung kemandirian ekonomi daerah.
                          </span>
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row justify-end gap-2 border-t border-slate-100 pt-4 mt-2 w-full shrink-0 min-w-0">
                        <DialogClose asChild>
                          <Button variant="outline" className="rounded-xl font-bold h-11 px-5 cursor-pointer">Tutup</Button>
                        </DialogClose>
                        <a href={getWaLink(product)} target="_blank" rel="noopener noreferrer">
                          <Button className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer">
                            <MessageCircle className="h-5 w-5" />
                            Beli via WhatsApp
                          </Button>
                        </a>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>

            <div className="text-center flex justify-center">
              <Button
                onClick={() => {
                  window.history.pushState({}, "", "/produk-wb");
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
