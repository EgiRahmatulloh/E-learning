import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlumniItem {
  id: number;
  nama: string;
  program: string;
  tahunLulus: string;
  cerita: string;
  foto: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("semua");

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

  const years = Array.from(new Set(testimonials.map((t) => t.tahunLulus))).sort((a, b) => Number(b) - Number(a));

  const filtered = activeTab === "semua"
    ? testimonials
    : testimonials.filter((t) => t.tahunLulus === activeTab);

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

          {years.length > 0 && (
            <div className="flex justify-center pt-4">
              <Tabs defaultValue="semua" value={activeTab} onValueChange={setActiveTab} className="w-fit">
                <TabsList className="bg-slate-200/60 p-1 rounded-full flex gap-1 h-auto border border-slate-200/30">
                  <TabsTrigger
                    value="semua"
                    className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                  >
                    Semua Angkatan
                  </TabsTrigger>
                  {years.map((year) => (
                    <TabsTrigger
                      key={year}
                      value={year}
                      className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600 cursor-pointer"
                    >
                      Angkatan {year}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#280f91]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {filtered.map((t) => (
              <Card key={t.id} className="border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col justify-between shadow-xl bg-white relative p-8 rounded-3xl">
                <span className="absolute top-6 right-8 text-6xl font-black text-slate-100 font-serif leading-none select-none">
                  &ldquo;
                </span>

                <div className="space-y-4 relative z-10 flex-1">
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed italic">
                    &ldquo;{t.cerita}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 mt-6 shrink-0 relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-md shadow-slate-200/20 shrink-0">
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
                  <div>
                    <h4 className="text-sm font-black text-[#280f91] leading-tight">{t.nama}</h4>
                    <span className="block text-xs font-bold text-[#ff6105] mt-0.5">{t.program} ({t.tahunLulus})</span>
                  </div>
                </div>
              </Card>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-dashed border-slate-200">
                Tidak ada data testimoni untuk angkatan ini.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
