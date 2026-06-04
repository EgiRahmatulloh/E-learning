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
import { MessageCircle, Sparkles } from "lucide-react";
import type { ProductItem } from "../../types/landing";

const productItems: ProductItem[] = [
  {
    id: 1,
    name: "Kerajinan Bambu Estetik",
    price: "Rp 45.000",
    description: "Tempat pensil dan pajangan estetik ramah lingkungan buatan tangan warga belajar PKBM.",
    image: "/images/02b90792f1b8702e02039ed4a61d8420.jpg",
    imageGlow: "from-orange-500/20 to-amber-500/20",
    waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Kerajinan%20Bambu%20Estetik%20karya%20warga%20belajar."
  },
  {
    id: 2,
    name: "Kue Pengantin Premium",
    price: "Rp 250.000",
    description: "Kue hias pengantin premium yang diproduksi secara higienis oleh kelompok belajar wirausaha boga.",
    image: "/images/f94ee3cd91bec22a90625ccf63879eb4.jpg",
    imageGlow: "from-yellow-500/20 to-orange-500/20",
    waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Kue%20Pengantin%20Premium%20karya%20warga%20belajar."
  },
  {
    id: 3,
    name: "Tas & Keset Rajut Elegan",
    price: "Rp 85.000",
    description: "Tas dan keset rajutan tangan yang kuat, modis, dan dibuat dengan detail tinggi menggunakan benang rajut berkualitas.",
    image: "/images/b5212ec568f692a2bb92f8a422335d81.jpg",
    imageGlow: "from-purple-500/20 to-pink-500/20",
    waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Tas%20dan%20Keset%20Rajut%20Elegan%20karya%20warga%20belajar."
  },
  {
    id: 4,
    name: "Aksesoris Manik Kreatif",
    price: "Rp 25.000",
    description: "Gelang dan kalung manik-manik cantik hasil kerajinan tangan warga belajar untuk aksesoris harian.",
    image: "/images/2160f0de812acb1585c6ed4218198819.png",
    imageGlow: "from-blue-500/20 to-cyan-500/20",
    waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Aksesoris%20Manik%20Kreatif%20karya%20warga%20belajar."
  }
];

export default function Products() {
  return (
    <section id="produk" className="pt-8 pb-20 bg-[#f0f9ff] border-y border-slate-200 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered purple-green Title (Matches News Style) */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center leading-none">
            <span className="text-[#9c27b0] font-black drop-shadow-sm">
              PRODUK
            </span>{" "}
            <span className="text-[#0ff60a] font-black drop-shadow-xs">
              WARGA BELAJAR
            </span>
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-2xl mx-auto text-center">
            Etalase kreativitas dan kemandirian ekonomi warga belajar PKBM Menuju Makmur melalui berbagai produk berkualitas hasil karya tangan terampil.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {productItems.map((product) => (
            <Dialog key={product.id}>
              <DialogTrigger asChild>
                <div 
                  className="bg-white rounded-3xl overflow-hidden shadow-lg p-4 flex flex-col justify-between border border-slate-100 group hover:border-[#ff6105] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-left"
                >
                  {/* Visual Representation of product - Matches News/Agenda Image Frame */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-100 shadow-inner">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                    
                    {/* Floating Price Tag */}
                    <span className="absolute bottom-3 right-3 inline-block rounded-lg bg-[#ff6105] px-2.5 py-1 text-[11px] font-black text-white shadow-md">
                      {product.price}
                    </span>
                  </div>

                  {/* Text Details Area */}
                  <div className="space-y-3 text-left px-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-[#280f91] group-hover:text-[#ff6105] transition-colors leading-tight line-clamp-2 uppercase">
                        {product.name}
                      </h3>
                      <p className="text-slate-600 text-[10px] font-semibold leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
                      <a 
                        href={product.waLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[8px] font-black text-emerald-600 hover:text-[#ff6105] uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        PESAN VIA WA &gt;&gt;
                      </a>
                      <span className="text-slate-300 text-[8px] font-black uppercase">READY</span>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#280f91]">{product.name}</DialogTitle>
                  <DialogDescription className="text-sm font-bold text-[#ff6105]">{product.price}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    {product.description}
                  </p>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-start gap-2.5">
                    <Sparkles className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-orange-900 leading-relaxed">
                      Produk ini dibuat langsung oleh kelompok wirausaha mandiri warga belajar PKBM Menuju Makmur untuk mendukung kemandirian ekonomi daerah.
                    </span>
                  </div>
                </div>
                <DialogFooter className="flex sm:justify-between items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl font-bold cursor-pointer">Tutup</Button>
                  </DialogClose>
                  <a href={product.waLink} target="_blank" rel="noopener noreferrer">
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
    </section>
  );
}
