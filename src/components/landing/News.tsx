import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar, ArrowRight } from "lucide-react";
import type { NewsItem } from "../../types/landing";

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B",
    category: "sekolah",
    date: "20 Mei 2026",
    excerpt: "Persiapan pelaksanaan ujian kesetaraan tingkat sekolah menengah pertama telah matang. Seluruh peserta siap mengikuti ujian berbasis digital.",
    image: "/images/19b2925ff9dc56c67af6213fc71a0037.jpg",
    imageGlow: "from-blue-500/20 to-purple-500/20"
  },
  {
    id: 2,
    title: "Pelatihan Pembuatan Produk Kreatif Berbahan Bambu oleh Warga Belajar",
    category: "aktivitas",
    date: "15 Mei 2026",
    excerpt: "Mengembangkan kerajinan bambu lokal Bernilai ekonomi tinggi. Kegiatan ini melatih kemandirian dan daya kreatif siswa kesetaraan.",
    image: "/images/73a999addd2b8ea3aed6da538ea5db3a.jpg",
    imageGlow: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: 3,
    title: "Apresiasi Warga Belajar Berprestasi Tingkat Kabupaten Ciamis",
    category: "prestasi",
    date: "02 Mei 2026",
    excerpt: "Siswa PKBM Menuju Makmur berhasil menyabet penghargaan kreativitas pemuda bidang wirausaha mandiri Ciamis 2026.",
    image: "/images/0fa045f1f00267c7c35442f158ab8ef8.jpg",
    imageGlow: "from-emerald-500/20 to-teal-500/20"
  }
];

export default function News() {
  const [activeNewsTab, setActiveNewsTab] = useState<"semua" | "sekolah" | "aktivitas" | "prestasi">("semua");

  // Filtered News
  const filteredNews = activeNewsTab === "semua" 
    ? newsItems 
    : newsItems.filter(n => n.category === activeNewsTab);

  return (
    <section id="berita" className="py-24 bg-slate-50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
              Informasi & Berita
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
              Kabar Terkini PKBM
            </h2>
            <p className="text-slate-600 font-medium">
              Ikuti terus kabar kegiatan sekolah, pengumuman ujian, prestasi warga belajar, serta momen kebersamaan di PKBM.
            </p>
          </div>

          {/* Interactive Filters */}
          <Tabs defaultValue="semua" value={activeNewsTab} onValueChange={(v) => setActiveNewsTab(v as any)} className="w-fit">
            <TabsList className="bg-slate-200/60 p-1 rounded-full flex gap-1 h-auto border border-slate-200/30">
              {(["semua", "sekolah", "aktivitas", "prestasi"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                >
                  {tab === "semua" ? "Semua Berita" : tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {filteredNews.map((news) => (
            <Dialog key={news.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer">
                  {/* Actual Image from public/images */}
                  <div className="h-48 w-full relative overflow-hidden">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#280f91] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-xs z-10">
                      {news.category}
                    </span>
                  </div>

                  <CardContent className="p-6 flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {news.date}
                    </div>
                    <h3 className="text-lg font-black text-[#280f91] leading-snug group-hover:text-[#ff6105] transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-3">
                      {news.excerpt}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-black text-sm text-[#ff6105] group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1.5"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                <DialogHeader>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#ff6105] uppercase tracking-wider mb-2">
                    <span>{news.category}</span>
                    <span>•</span>
                    <span>{news.date}</span>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#280f91] leading-tight">
                    {news.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      loading="lazy"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed">
                    {news.excerpt}
                  </p>
                  <DialogDescription className="text-slate-500 text-sm leading-relaxed">
                    Pelaksanaan kegiatan ini merupakan komitmen PKBM Menuju Makmur untuk terus meningkatkan mutu dan aksesibilitas pendidikan bagi seluruh lapisan masyarakat di Kabupaten Ciamis. Untuk info lebih lengkap, hubungi sekretariat utama kami di Cintanagara, Ciamis.
                  </DialogDescription>
                </div>
                <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                  <DialogClose asChild>
                    <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 cursor-pointer">
                      Tutup Bacaan
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
}
