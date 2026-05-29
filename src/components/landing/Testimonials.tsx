import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Testimonial } from "../../types/landing";

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Kaka Al fatih",
    year: 2026,
    role: "Alumni",
    avatar: "/images/756dabd87e0df26cc6b0b3474894942b.jpg",
    quote: "Saya sangat bersyukur pernah menjadi bagian dari PKBM Menuju Makmur. Awalnya saya memiliki keraguan untuk melanjutkan pendidikan melalui jalur nonformal, tetapi setelah bergabung saya merasakan lingkungan belajar yang nyaman dan mendukung. Para tutor sangat ramah, sabar, dan selalu memberikan semangat kepada setiap peserta didik untuk terus belajar dan berkembang."
  },
  {
    id: 2,
    name: "Cep Dafa",
    year: 2026,
    role: "Alumni",
    avatar: "/images/986d04e45d4017d30a64a9afbc5903c0.jpg",
    quote: "Sebagai alumni, saya merasa bangga pernah belajar di PKBM Menuju Makmur karena telah menjadi tempat yang membantu saya meraih pendidikan dan membuka kesempatan yang lebih baik untuk masa depan. Saya berharap PKBM Menuju Makmur terus berkembang dan menjadi tempat belajar yang bermanfaat bagi banyak orang."
  },
  {
    id: 3,
    name: "Oing",
    year: 2025,
    role: "Alumni",
    avatar: "/images/2941ab4cdbd67c54025d31b93d4a5dac.png",
    quote: "Di PKBM Menuju Makmur saya tidak hanya mendapatkan ilmu pengetahuan, tetapi juga banyak pengalaman berharga. Sistem pembelajarannya cukup fleksibel sehingga membantu saya menyesuaikan antara kegiatan belajar dengan aktivitas lainnya. Selain itu, saya juga belajar tentang kedisiplinan, tanggung jawab, dan pentingnya terus meningkatkan kemampuan diri."
  }
];

export default function Testimonials() {
  const [activeAlumniTab, setActiveAlumniTab] = useState<number | "semua">("semua");

  // Filtered Testimonials
  const filteredTestimonials = activeAlumniTab === "semua" 
    ? testimonials 
    : testimonials.filter(t => t.year === activeAlumniTab);

  return (
    <section id="alumni" className="py-24 bg-slate-50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Testimoni Alumni
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
            Saksikan Pengalaman Alumni Kami
          </h2>
          <p className="text-slate-600 font-semibold leading-relaxed">
            Dengarkan langsung cerita sukses, kemudahan fleksibilitas belajar, dan pencapaian bermakna dari alumni terbaik PKBM Menuju Makmur.
          </p>

          {/* Tab Filters */}
          <div className="flex justify-center pt-4">
            <Tabs defaultValue="semua" value={String(activeAlumniTab)} onValueChange={(v) => setActiveAlumniTab(v === "semua" ? "semua" : parseInt(v))} className="w-fit">
              <TabsList className="bg-slate-200/60 p-1 rounded-full flex gap-1 h-auto border border-slate-200/30">
                <TabsTrigger
                  value="semua"
                  className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                >
                  Semua Angkatan
                </TabsTrigger>
                <TabsTrigger
                  value="2026"
                  className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                >
                  Angkatan 2026
                </TabsTrigger>
                <TabsTrigger
                  value="2025"
                  className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                >
                  Angkatan 2025
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Testimonial Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {filteredTestimonials.map((t) => (
            <Card key={t.id} className="border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col justify-between shadow-xl bg-white relative p-8 rounded-3xl">
              <span className="absolute top-6 right-8 text-6xl font-black text-slate-100 font-serif leading-none select-none">
                “
              </span>
              
              <div className="space-y-4 relative z-10 flex-1">
                <p className="text-slate-600 text-sm font-semibold leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-slate-100 mt-6 shrink-0 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-md shadow-slate-200/20 shrink-0">
                  <img 
                    src={t.avatar} 
                    alt={t.name}
                    loading="lazy"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#280f91] leading-tight">{t.name}</h4>
                  <span className="block text-xs font-bold text-[#ff6105] mt-0.5">{t.role} ({t.year})</span>
                </div>
              </div>
            </Card>
          ))}

          {filteredTestimonials.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-dashed border-slate-200">
              Tidak ada data testimoni untuk angkatan ini.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
