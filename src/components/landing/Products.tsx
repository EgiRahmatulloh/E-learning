import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
  }
];

export default function Products() {
  return (
    <section id="produk" className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Etalase Produk
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
            Produk Warga Belajar
          </h2>
          <p className="text-slate-600 font-semibold leading-relaxed">
            Dukung kreativitas warga belajar dengan membeli produk karya mereka. Dibuat dengan penuh kreativitas, berkualitas, dan harga terjangkau.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {productItems.map((product) => (
            <Dialog key={product.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer">
                  
                  {/* Visual Representation of product */}
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                    
                    {/* Floating Price Tag */}
                    <span className="absolute bottom-4 right-4 inline-flex items-center rounded-lg bg-[#ff6105] px-3.5 py-1 text-sm font-black text-white shadow-md">
                      {product.price}
                    </span>
                  </div>

                  <CardContent className="p-6 flex-1 space-y-2">
                    <h3 className="text-lg font-black text-[#280f91] group-hover:text-[#ff6105] transition-colors leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      {product.description}
                    </p>
                  </CardContent>

                  {/* Footer with WA link and tooltipped hover */}
                  <CardFooter className="p-6 pt-0" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-all flex items-center justify-center gap-2 cursor-pointer">
                          <a 
                            href={product.waLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-5 w-5" />
                            Hubungi Penjual
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-950 text-white font-bold py-1.5 px-3 rounded-lg shadow-xl text-xs">
                        Hubungi penjual via WhatsApp
                      </TooltipContent>
                    </Tooltip>
                  </CardFooter>
                </Card>
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
