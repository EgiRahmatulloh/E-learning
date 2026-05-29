import { useState, useEffect } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Pendidikan Setara & Fleksibel",
    description: "Belajar tanpa batas usia, waktu, maupun keadaan. Kami siap membimbing Anda meraih masa depan gemilang.",
    image: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
    stats: "350+ Warga Belajar Aktif",
    tagline: "Paket A, B, & C"
  },
  {
    title: "Ujian Pendidikan Kesetaraan (UPK)",
    description: "Penyelenggara resmi Ujian Pendidikan Kesetaraan Paket B & Paket C dengan fasilitas terstandarisasi.",
    image: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
    stats: "Kelulusan Terakreditasi",
    tagline: "Penyelenggara Resmi"
  },
  {
    title: "Kreativitas & Produk Karya Warga Belajar",
    description: "Mendukung kemandirian warga belajar dengan melatih keterampilan dan mempromosikan produk kreatif buatan mandiri.",
    image: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
    stats: "Kreatif & Mandiri",
    tagline: "Wirausaha Muda"
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slide loop timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section id="beranda" className="relative bg-white pt-12 pb-24 overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto mb-16">
          {/* Outlined Glowing Canva-style welcome header */}
          <div className="inline-block relative">
            <span className="relative z-10 block text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-[#0ff60a] drop-shadow-[0_2px_10px_rgba(15,246,10,0.3)] select-none">
              Selamat Datang
            </span>
            <span className="absolute inset-0 block text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white stroke-2 select-none -translate-y-[1px]" style={{ WebkitTextStroke: '2px #280f91' }}>
              Selamat Datang
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[#280f91] select-none leading-none">
            Di Website <span className="text-[#ff6105] relative inline-block">
              PKBM MENUJU MAKMUR
              <span className="absolute bottom-0 left-0 w-full h-[6px] bg-[#cafc05]/80 rounded-full -z-10"></span>
            </span>
          </h1>
          
          <p className="text-lg sm:text-2xl font-bold leading-relaxed text-[#280f91]/90 max-w-3xl mx-auto drop-shadow-xs italic px-4">
            “Belajar tidak mengenal batas usia, waktu, maupun keadaan. Wujudkan masa depan yang lebih baik melalui pendidikan”
          </p>
        </div>

        {/* Interactive Slideshow Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* The Slide Display */}
          <div className="relative h-[320px] sm:h-[460px] w-full overflow-hidden rounded-3xl border-4 border-[#280f91] bg-slate-900 shadow-2xl transition-all">
            {slides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 flex flex-col justify-end p-8 sm:p-16 transition-opacity duration-1000 ${
                  idx === currentSlide ? "opacity-100 z-10 animate-in fade-in duration-1000" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                {/* Slide Content */}
                <div className="relative z-20 space-y-3 max-w-2xl text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-black tracking-widest text-[#cafc05] uppercase border border-white/10">
                    <Sparkles className="h-3.5 w-3.5" />
                    {slide.tagline}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                    {slide.description}
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs font-bold text-[#cafc05]">
                    <span className="h-2 w-2 rounded-full bg-[#cafc05]"></span>
                    {slide.stats}
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Indicator Dots */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? "w-8 bg-[#280f91]" : "w-3 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
