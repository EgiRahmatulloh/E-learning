import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ImageIcon } from "lucide-react";

interface SlideData {
  image: string;
  title: string;
  description: string;
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    image: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
    title: "Pendidikan Setara & Fleksibel",
    description: "Belajar tanpa batas usia, waktu, maupun keadaan.",
  },
  {
    image: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
    title: "Ujian Pendidikan Kesetaraan (UPK)",
    description: "Penyelenggara resmi Ujian Pendidikan Kesetaraan Paket B & Paket C.",
  },
  {
    image: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
    title: "Kreativitas & Produk Karya Warga Belajar",
    description: "Mendukung kemandirian warga belajar.",
  },
];

const STORAGE_KEY = "pkbm_slider_data";

export function SliderManager() {
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setSlides(parsed);
        }
      } catch {
        // ignore invalid data
      }
    }
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    const timer = setTimeout(() => {
      setToast({ message: "", show: false });
    }, 3000);
    return () => clearTimeout(timer);
  };

  const handleSlideChange = (index: number, field: keyof SlideData, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    showToast("Perubahan slider beranda berhasil disimpan!");
  };

  return (
    <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-[#280f91]">Kelola Slider Beranda</h3>
          <p className="text-xs text-slate-500 font-semibold">Atur gambar, judul, dan deskripsi untuk 3 slide hero di halaman utama.</p>
        </div>
        <Button
          onClick={handleSave}
          className="h-10 bg-[#280f91] text-white hover:bg-[#ff6105] rounded-lg font-bold text-xs cursor-pointer shadow-md shadow-[#280f91]/10 transition-colors"
        >
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {slides.map((slide, index) => (
          <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-[#280f91] flex items-center justify-center text-white font-black text-sm shadow-md">
                {index + 1}
              </div>
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">Slide {index + 1}</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
              <div className="space-y-2">
                <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-[10px] font-bold">No Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">URL / Path Gambar</label>
                  <input
                    type="text"
                    placeholder="/images/nama-file.jpg"
                    value={slide.image}
                    onChange={(e) => handleSlideChange(index, "image", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Judul Slide</label>
                  <input
                    type="text"
                    placeholder="Judul slide"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Deskripsi</label>
                  <input
                    type="text"
                    placeholder="Deskripsi singkat slide"
                    value={slide.description}
                    onChange={(e) => handleSlideChange(index, "description", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </Card>
  );
}
