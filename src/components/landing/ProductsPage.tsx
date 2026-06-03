import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Sparkles, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface ProductItem {
  id: number;
  namaProduk: string;
  deskripsi: string;
  noHp: string;
  penjual: string;
  satuan: string;
  harga: number;
  status: string;
  gambar: string;
}

interface ProductsPageProps {
  onNavigate?: (path: string) => void;
}

export default function ProductsPage(_props: ProductsPageProps) {
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProductsList(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = productsList.filter((item) =>
    item.namaProduk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatWaNumber = (num: string) => {
    if (!num) return "";
    let clean = num.replace(/\D/g, "");
    if (clean.length < 9) return "";
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return clean;
  };

  const getWaLink = (item: ProductItem | null) => {
    if (!item || !item.noHp) return "#";
    const cleanNoHp = formatWaNumber(item.noHp);
    if (!cleanNoHp) return "#";
    const text = encodeURIComponent(
      `Halo ${item.penjual || "Penjual"}, saya tertarik membeli ${item.namaProduk || "produk"} karya Anda.`
    );
    return `https://wa.me/${cleanNoHp}?text=${text}`;
  };

  return (
    <section id="products-landing" className="py-20 bg-[#f0f9ff] border-y border-slate-200 relative overflow-hidden min-h-[85vh] text-left">
      {/* Dynamic Background Blob elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        


        {/* Centered Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-100 rounded-full px-4 py-1.5 inline-block">
            Karya & Kreativitas Warga Belajar
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none text-[#280f91] uppercase drop-shadow-sm">
            PRODUK WARGA BELAJAR
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-3xl mx-auto">
            Dukung kemandirian ekonomi warga belajar PKBM Menuju Makmur dengan membeli produk hasil karya wirausaha kreatif mereka.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 relative">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-white/95 text-slate-700 text-sm font-semibold pl-12 pr-4 py-3.5 rounded-2xl border border-cyan-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md placeholder-slate-400"
              placeholder="Cari produk warga belajar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-slate-500 font-bold text-sm">Memuat daftar produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white/60 border-2 border-dashed border-cyan-200 rounded-3xl max-w-3xl mx-auto">
            <ShoppingBag className="mx-auto text-slate-300 mb-3 h-12 w-12" />
            <h4 className="text-sm font-black text-slate-800 uppercase">Tidak Ada Produk</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-semibold">
              Tidak ada produk yang cocok dengan pencarian Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl overflow-hidden border border-cyan-100 hover:border-emerald-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col shadow-lg group">
                
                {/* Image Container with Hover glow */}
                <div className="h-52 w-full relative overflow-hidden bg-slate-50 border-b border-slate-100">
                  {product.gambar ? (
                    <img 
                      src={product.gambar} 
                      alt={product.namaProduk}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/50">
                      <ShoppingBag className="h-10 w-10 mb-1" />
                      <span className="text-xs font-semibold">Foto Produk</span>
                    </div>
                  )}
                  
                  {/* Floating Price Tag */}
                  <span className="absolute bottom-4 right-4 inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md">
                    Rp. {product.harga.toLocaleString("id-ID")},-
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                        Karya: {product.penjual}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Per {product.satuan}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#280f91] group-hover:text-emerald-600 transition-colors leading-tight truncate">
                      {product.namaProduk}
                    </h3>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed line-clamp-3">
                      {product.deskripsi}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                    <Button 
                      onClick={() => setSelectedProduct(product)}
                      variant="outline" 
                      className="flex-1 rounded-xl font-bold text-xs h-10 cursor-pointer"
                    >
                      Detail
                    </Button>

                    {/* Purchase WA link */}
                    <a 
                      href={getWaLink(product)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full rounded-xl bg-[#00e676] hover:bg-emerald-600 text-emerald-950 hover:text-white font-bold text-xs h-10 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <MessageCircle className="h-4 w-4 fill-current" />
                        Pesan
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Details Popup Modal */}
        <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#280f91]">{selectedProduct.namaProduk}</DialogTitle>
                  <DialogDescription className="text-sm font-bold text-emerald-600 mt-1">
                    Rp. {selectedProduct.harga.toLocaleString("id-ID")},- / {selectedProduct.satuan}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200 bg-slate-50">
                    {selectedProduct.gambar ? (
                      <img 
                        src={selectedProduct.gambar} 
                        alt={selectedProduct.namaProduk}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <ShoppingBag className="h-12 w-12 mb-2" />
                        <span className="text-xs font-semibold">Foto Produk Belum Tersedia</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deskripsi Karya</h4>
                    <p className="text-slate-600 text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-line">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Warga Belajar / Penjual</span>
                      <span className="font-bold text-[#280f91]">{selectedProduct.penjual}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">No. HP / WA Penjual</span>
                      <span className="font-mono font-bold text-slate-600">{selectedProduct.noHp}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-emerald-800 leading-normal">
                      Produk ini dibuat langsung oleh kelompok wirausaha mandiri warga belajar PKBM Menuju Makmur sebagai karya kecakapan hidup (life skills).
                    </span>
                  </div>
                </div>

                <DialogFooter className="flex sm:justify-between items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl font-bold cursor-pointer text-xs">Tutup</Button>
                  </DialogClose>
                  <a href={getWaLink(selectedProduct)} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 flex items-center gap-1.5 cursor-pointer text-xs">
                      <MessageCircle className="h-4 w-4" />
                      Pesan Sekarang
                    </Button>
                  </a>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
