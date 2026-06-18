import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import eSpmbImg from "@/assets/E-SPMB.jpeg";
import eLearningImg from "@/assets/E-LEARNING.jpeg";
import eUjianImg from "@/assets/E-UJIAN.jpeg";

interface SlideData {
  image: string;
  title: string;
  status?: string;
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    image: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
    title: "Pendidikan Setara & Fleksibel",
  },
  {
    image: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
    title: "Ujian Pendidikan Kesetaraan (UPK)",
  },
  {
    image: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
    title: "Kreativitas & Produk Karya Warga Belajar",
  },
];

interface HeroProps {
  onServiceClick?: (service: "e-spmb" | "e-learning" | "e-ujian") => void;
}

// Safe LocalStorage helpers to prevent runtime errors in restricted environments
const getSafeItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSafeItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage exceptions
  }
};

// Strict slide validation type guard
function isValidSlide(slide: any): slide is SlideData {
  return (
    slide !== null &&
    typeof slide === "object" &&
    typeof slide.image === "string" &&
    slide.image.trim() !== "" &&
    typeof slide.title === "string"
  );
}

export default function Hero({ onServiceClick }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load slider data from API with localStorage fallback
  useEffect(() => {
    const fetchLandingSliders = async () => {
      try {
        const res = await fetch("/api/sliders");
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const validated = data.data.filter(isValidSlide);
          const activeSlides = validated.filter((slide: SlideData) => slide.status !== "NON AKTIF");
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          } else {
            setSlides(DEFAULT_SLIDES);
          }
          setSafeItem("pkbm_slider_data", JSON.stringify(validated));
          return;
        }
      } catch {
        // network failure fallback to localStorage
      }

      // Local storage fallback
      try {
        const stored = getSafeItem("pkbm_slider_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validated = parsed.filter(isValidSlide);
            const activeSlides = validated.filter((slide: SlideData) => slide.status !== "NON AKTIF");
            if (activeSlides.length > 0) {
              setSlides(activeSlides);
            } else {
              setSlides(DEFAULT_SLIDES);
            }
            return;
          }
        }
      } catch {
        // ignore
      }
      setSlides(DEFAULT_SLIDES);
    };

    fetchLandingSliders();
  }, []);

  const clearTransitionTimer = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  const clearAutoSlideTimer = () => {
    if (autoSlideTimerRef.current) {
      clearTimeout(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  };

  const startAutoSlide = useCallback(() => {
    clearAutoSlideTimer();
    // Do not auto-slide if there is only 1 slide
    if (slides.length <= 1) return;

    autoSlideTimerRef.current = setTimeout(() => {
      clearTransitionTimer();
      setIsTransitioning(true);
      transitionTimerRef.current = setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
        startAutoSlide(); // Trigger next slide timeout seamlessly
      }, 400);
    }, 6000);
  }, [slides.length]);

  // Handle timeout-based auto slide instead of interval to avoid glitches
  useEffect(() => {
    startAutoSlide();
    return () => {
      clearAutoSlideTimer();
      clearTransitionTimer();
    };
  }, [startAutoSlide]);

  const goToSlide = useCallback((idx: number) => {
    clearAutoSlideTimer();
    clearTransitionTimer();
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setCurrentSlide(idx);
      setIsTransitioning(false);
      startAutoSlide(); // Resume auto-sliding from the newly active slide
    }, 400);
  }, [startAutoSlide]);

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);


  return (
    <section id="beranda" className="relative w-full overflow-hidden h-screen min-h-screen">
      {/* ===== SLIDER BACKGROUND ===== */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out bg-slate-950"
            style={{
              opacity: idx === currentSlide && !isTransitioning ? 1 : 0,
              zIndex: idx === currentSlide ? 1 : 0
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />
      </div>

      {/* ===== MAIN CONTENT OVERLAY ===== */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center pt-20 pb-24 lg:pb-12">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 lg:gap-8 py-6 lg:py-12">

          {/* ===== LEFT: Welcome Text ===== */}
          <div className="flex-1 max-w-2xl text-center lg:text-left space-y-3 lg:space-y-4">
            {/* Decorative "Selamat Datang" */}
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl leading-none select-none"
              style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontStyle: "italic",
                fontWeight: 700,
                color: "#0ff60a",
                textShadow: "0 2px 20px rgba(15, 246, 10, 0.4), 0 0 40px rgba(15, 246, 10, 0.15)",
              }}
            >
              Selamat Datang
            </h2>

            {/* "Di Website" */}
            <h3
              className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight select-none"
              style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontStyle: "italic",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              Di Website
            </h3>

            {/* "PKBM MENUJU MAKMUR" */}
            <h1
              className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-none select-none tracking-tight"
              style={{
                color: "#ff6105",
                textShadow: "0 3px 15px rgba(255, 97, 5, 0.3), 2px 2px 0px rgba(0,0,0,0.3)",
              }}
            >
              PKBM MENUJU MAKMUR
            </h1>

            {/* Quote — hidden on small mobile, shown on sm+ */}
            <blockquote className="hidden sm:block relative mt-6 pl-4 border-l-4 border-[#cafc05]/60">
              <p
                className="text-sm sm:text-base lg:text-lg text-white/90 italic font-medium leading-relaxed"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
              >
                "Belajar tidak mengenal batas usia, waktu, maupun keadaan. Wujudkan masa depan yang lebih baik melalui pendidikan"
              </p>
            </blockquote>

            {/* Slide Indicator Dots (desktop only — mobile dot ada di bottom) */}
            {slides.length > 1 && (
              <div className="hidden lg:flex items-center gap-3 mt-8 justify-center lg:justify-start">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-3 rounded-full transition-all duration-500 cursor-pointer ${idx === currentSlide
                        ? "w-10 bg-[#cafc05] shadow-md shadow-[#cafc05]/30"
                        : "w-3 bg-white/40 hover:bg-white/70"
                      }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
                <span className="text-xs font-bold text-white/50 ml-2 tabular-nums">
                  {currentSlide + 1} / {slides.length}
                </span>
              </div>
            )}
          </div>

          {/* ===== RIGHT: Layanan Digital Portal ===== */}
          <div className="shrink-0 w-full lg:w-auto self-center lg:self-end pt-0 lg:pb-20">
            <div className="w-full sm:w-[280px] lg:w-[300px] mx-auto lg:mx-0">
              <h4
                className="text-center lg:text-left text-2xl sm:text-3xl font-black mb-4 select-none"
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontStyle: "italic",
                  color: "#ffffff",
                  textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                }}
              >
                Layanan Digital
              </h4>
              <div className="space-y-3">
                {/* E-SPMB Card */}
                <div
                  onClick={() => onServiceClick?.("e-spmb")}
                  className="group p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-lg flex items-center gap-4"
                >
                  <div className="bg-white/15 p-1.5 rounded-xl h-20 w-20 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={eSpmbImg} alt="E-SPMB" className="h-full w-full object-cover rounded-lg" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-snug">E-SPMB</h3>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-normal truncate">Pendaftaran Siswa Baru</p>
                    <span className="text-[11px] text-[#cafc05] underline mt-1.5 inline-block font-semibold group-hover:text-white transition-colors">
                      Lihat Selengkapnya &rarr;
                    </span>
                  </div>
                </div>

                {/* E-LEARNING Card */}
                <div
                  onClick={() => onServiceClick?.("e-learning")}
                  className="group p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-lg flex items-center gap-4"
                >
                  <div className="bg-white/15 p-1.5 rounded-xl h-20 w-20 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={eLearningImg} alt="E-LEARNING" className="h-full w-full object-cover rounded-lg" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-snug">E-LEARNING</h3>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-normal truncate">Portal Pembelajaran & Modul</p>
                    <span className="text-[11px] text-[#cafc05] underline mt-1.5 inline-block font-semibold group-hover:text-white transition-colors">
                      Lihat Selengkapnya &rarr;
                    </span>
                  </div>
                </div>

                {/* E-UJIAN Card */}
                <div
                  onClick={() => onServiceClick?.("e-ujian")}
                  className="group p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-lg flex items-center gap-4"
                >
                  <div className="bg-white/15 p-1.5 rounded-xl h-20 w-20 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={eUjianImg} alt="E-UJIAN" className="h-full w-full object-cover rounded-lg" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-snug">E-UJIAN</h3>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-normal truncate">Ujian Pendidikan Kesetaraan</p>
                    <span className="text-[11px] text-[#cafc05] underline mt-1.5 inline-block font-semibold group-hover:text-white transition-colors">
                      Lihat Selengkapnya &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SLIDER NAVIGATION ARROWS (Desktop) ===== */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden lg:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden lg:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* ===== MOBILE: Slider controls at bottom ===== */}
      {slides.length > 1 && (
        <div className="lg:hidden absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
          <button
            onClick={prevSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-lg shrink-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                  idx === currentSlide
                    ? "w-8 bg-[#cafc05] shadow-md shadow-[#cafc05]/30"
                    : "w-2.5 bg-white/40"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-lg shrink-0"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ===== WHATSAPP FLOATING BUTTON ===== */}
      <a
        href="https://wa.me/6282128594025?text=Halo%20Admin%20PKBM%20Menuju%20Makmur"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-green-600/40 hover:bg-[#1ebe5d] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-bounce"
        style={{ animationDuration: "2s", animationIterationCount: 3 }}
        aria-label="Hubungi via WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="h-8 w-8"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M27.286 4.65A15.84 15.84 0 0 0 16.029.001C7.214.001.038 7.176.034 15.993a15.95 15.95 0 0 0 2.133 7.994L0 32l8.198-2.151a16 16 0 0 0 7.825 1.994h.007c8.814 0 15.99-7.176 15.994-15.993a15.9 15.9 0 0 0-4.738-11.2M16.03 29.143h-.005a13.3 13.3 0 0 1-6.767-1.853l-.485-.288-5.064 1.328 1.351-4.937-.316-.504a13.27 13.27 0 0 1-2.034-7.096C2.713 8.644 8.679 2.68 16.034 2.68a13.3 13.3 0 0 1 9.412 3.903 13.23 13.23 0 0 1 3.897 9.416c-.003 7.371-5.969 13.144-13.314 13.144m7.298-9.954c-.4-.2-2.366-1.168-2.733-1.301-.367-.133-.633-.2-.9.2s-1.033 1.301-1.267 1.568-.467.3-.866.1c-.4-.2-1.689-.623-3.216-1.985-1.189-1.061-1.992-2.371-2.225-2.772s-.025-.616.175-.815c.18-.179.4-.467.6-.7s.267-.4.4-.667.067-.5-.033-.7-.9-2.169-1.233-2.97c-.325-.78-.655-.674-.9-.687-.233-.011-.5-.014-.766-.014a1.47 1.47 0 0 0-1.067.5c-.367.4-1.399 1.368-1.399 3.336s1.433 3.87 1.633 4.137 2.819 4.305 6.829 6.038c.954.412 1.699.659 2.28.844.957.305 1.829.262 2.518.158.768-.114 2.366-.967 2.7-1.901s.333-1.734.233-1.901-.367-.267-.766-.467" />
        </svg>
      </a>
    </section>
  );
}
