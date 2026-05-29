import type { GalleryItem } from "../../types/landing";

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Kegiatan Ujian Berbasis Komputer",
    category: "Pembelajaran",
    image: "/images/a779577c8607ebe42afd0b761f7181de.png"
  },
  {
    id: 2,
    title: "Workshop Kewirausahaan Kerajinan",
    category: "Pelatihan",
    image: "/images/350444bf2de0d2ffb2a5356d7662b1f3.jpg"
  },
  {
    id: 3,
    title: "Momen Kelulusan Alumni",
    category: "Kegiatan Luar Kelas",
    image: "/images/53cc4301b5dcca30abc82da87c7ee158.jpg"
  }
];

export default function Gallery() {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {galleryItems.map((item) => (
            <div key={item.id} className="group overflow-hidden rounded-2xl border border-slate-100 shadow-md relative aspect-[4/3] bg-slate-100">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <span className="block text-[10px] font-black tracking-widest text-[#ff6105] uppercase mb-1">{item.category}</span>
                  <span className="text-white font-bold text-sm leading-tight block">{item.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
