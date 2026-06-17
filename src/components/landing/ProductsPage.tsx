import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Sparkles, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data.filter((p: ProductItem) => p.status === "AKTIF"));
        }
      })
      .catch((err) => console.error("Gagal memuat produk:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.namaProduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
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
    <section id="products-landing" className="pt-8 pb-20 bg-[#f0f9ff] border-y border-slate-200 relative overflow-hidden min-h-[85vh] text-left">
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
            Dukung karya dan kreativitas warga belajar dengan membeli produk mereka karena Setiap karya adalah bukti semangat, kreativitas, dan kemampuan warga belajar dalam mengembangkan potensi menuju masa depan yang lebih baik
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          </div>
        </div>

        {/* Products Grid (4 Column Cards vertical, News Style) */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => {
                  setSelectedProduct(product);
                  setDetailModalVisible(true);
                }}
                className="bg-[#20108a] rounded-3xl overflow-hidden border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 flex flex-col shadow-2xl cursor-pointer"
              >
                
                {/* Image Container with Hover glow */}
                <div className="h-52 w-full relative overflow-hidden bg-blue-950">
                  {product.gambar ? (
                    <img 
                      src={product.gambar} 
                      alt={product.namaProduk}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-slate-100/50">
                      <ShoppingBag className="h-10 w-10 mb-1" />
                      <span className="text-xs font-semibold">Foto Produk</span>
                    </div>
                  )}
                  
                  {/* Floating Price Tag */}
                  <span className="absolute bottom-3 right-3 inline-flex items-center rounded-lg bg-[#ff6105] px-2.5 py-1.5 text-[11px] font-black text-white shadow-md">
                    Rp {product.harga.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-[#00ff00] leading-tight line-clamp-2 uppercase group-hover:text-white transition-colors">
                      {product.namaProduk}
                    </h3>
                    <p className="text-white/80 text-[10px] font-semibold leading-relaxed line-clamp-2">
                      {product.deskripsi}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[8px] text-[#00ff00] font-black uppercase tracking-wider">
                    <span>PENJUAL: {product.penjual}</span>
                    <span className="text-white/50">{product.satuan}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        <Dialog open={detailModalVisible} onOpenChange={setDetailModalVisible}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#280f91] uppercase">{selectedProduct.namaProduk}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-[#ff6105]">Rp {selectedProduct.harga.toLocaleString("id-ID")}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedProduct.satuan}</span>
                  </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                    <img 
                      src={selectedProduct.gambar} 
                      alt={selectedProduct.namaProduk}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    {selectedProduct.deskripsi}
                  </p>
                  <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100 flex items-start gap-2.5">
                    <Sparkles className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-cyan-900 leading-relaxed">
                      Karya wirausaha kreatif warga belajar PKBM Menuju Makmur. Mari dukung produk lokal kami!
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penjual: {selectedProduct.penjual}</span>
                  </div>
                </div>
                <DialogFooter className="flex sm:justify-between items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl font-bold cursor-pointer h-11 px-6">Tutup</Button>
                  </DialogClose>
                  <a href={getWaLink(selectedProduct)} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20">
                      <MessageCircle className="h-5 w-5" />
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
