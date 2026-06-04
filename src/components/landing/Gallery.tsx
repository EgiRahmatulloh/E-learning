import { useState, useEffect } from "react";

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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/gallery", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setItems(data.data.slice(0, 3));
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to fetch gallery:", err);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <section id="galeri" className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Galeri Kegiatan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
            Dokumentasi & Kebersamaan
          </h2>
          <p className="text-slate-600 font-semibold leading-relaxed">
            Dokumentasi berbagai kegiatan sekolah, prestasi siswa, serta momen kebersamaan di PKBM Menuju Makmur.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6105]" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-400 text-sm font-bold py-12">Belum ada galeri.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {items.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-slate-100 shadow-md relative aspect-[4/3] bg-slate-100">
                <img
                  src={item.foto}
                  alt={item.namaFile}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div>
                    <span className="block text-[10px] font-black tracking-widest text-[#ff6105] uppercase mb-1">{item.kategori}</span>
                    <span className="text-white font-bold text-sm leading-tight block">{item.namaFile}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
