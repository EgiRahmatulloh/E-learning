import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

interface SlideData {
  image: string;
  title: string;
}

const DEFAULT_SLIDES: SlideData[] = [];

interface HeroProps {
  onServiceClick?: (service: "e-spmb" | "e-learning" | "e-ujian") => void;
}

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
          const activeSlides = validated.filter((slide: any) => slide.status !== "NON AKTIF");
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          } else {
            setSlides(validated);
          }
          localStorage.setItem("pkbm_slider_data", JSON.stringify(validated));
          return;
        }
      } catch {
        // network failure fallback to localStorage
      }

      // Local storage fallback
      try {
        const stored = localStorage.getItem("pkbm_slider_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validated = parsed.filter(isValidSlide);
            const activeSlides = validated.filter((slide: any) => slide.status !== "NON AKTIF");
            if (activeSlides.length > 0) {
              setSlides(activeSlides);
            } else {
              setSlides(validated);
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

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
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
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center min-h-screen">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 py-16 sm:py-20">
          
          {/* ===== LEFT: Welcome Text ===== */}
          <div className="flex-1 max-w-2xl text-center lg:text-left space-y-4">
            {/* Decorative "Selamat Datang" */}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-none select-none"
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
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight select-none"
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
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-none select-none tracking-tight"
              style={{
                color: "#ff6105",
                textShadow: "0 3px 15px rgba(255, 97, 5, 0.3), 2px 2px 0px rgba(0,0,0,0.3)",
              }}
            >
              PKBM MENUJU MAKMUR
            </h1>

            {/* Quote */}
            <blockquote className="relative mt-6 pl-4 border-l-4 border-[#cafc05]/60">
              <p
                className="text-sm sm:text-base lg:text-lg text-white/90 italic font-medium leading-relaxed"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
              >
                "Belajar tidak mengenal batas usia, waktu, maupun keadaan. Wujudkan masa depan yang lebih baik melalui pendidikan"
              </p>
            </blockquote>

            {/* Slide Indicator Dots */}
            {slides.length > 1 && (
              <div className="flex items-center gap-3 mt-8 justify-center lg:justify-start">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-3 rounded-full transition-all duration-500 cursor-pointer ${
                      idx === currentSlide
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
          <div className="shrink-0 w-full sm:w-auto">
            <div className="max-w-xs mx-auto lg:mx-0">
              <h4 
                className="text-center text-xl sm:text-2xl font-black text-white mb-6 tracking-tight"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
              >
                Layanan Digital
              </h4>
              <div className="space-y-3">
                {/* E-SPMB Button */}
                <button
                  onClick={() => onServiceClick?.("e-spmb")}
                  className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-base sm:text-lg tracking-wider py-4 px-6 shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-800/40 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">E-SPMB</span>
                </button>

                {/* E-LEARNING Button */}
                <button
                  onClick={() => onServiceClick?.("e-learning")}
                  className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#280f91] to-indigo-700 hover:from-indigo-600 hover:to-[#280f91] text-white font-black text-base sm:text-lg tracking-wider py-4 px-6 shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-800/40 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">E-LEARNING</span>
                </button>

                {/* E-UJIAN Button */}
                <button
                  onClick={() => onServiceClick?.("e-ujian")}
                  className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6105] to-amber-500 hover:from-amber-500 hover:to-[#ff6105] text-white font-black text-base sm:text-lg tracking-wider py-4 px-6 shadow-lg shadow-orange-900/30 hover:shadow-xl hover:shadow-orange-700/40 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">E-UJIAN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SLIDER NAVIGATION ARROWS ===== */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </>
      )}

      {/* ===== WHATSAPP FLOATING BUTTON ===== */}
      <a
        href="https://wa.me/6282128594025?text=Halo%20Admin%20PKBM%20Menuju%20Makmur"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-600/40 hover:bg-green-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-bounce"
        style={{ animationDuration: "2s", animationIterationCount: 3 }}
        aria-label="Hubungi via WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </section>
  );
}
