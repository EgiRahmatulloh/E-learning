import { useState, useEffect } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Layers, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Award, 
  Sparkles, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  BookMarked,
  Menu,
  X
} from "lucide-react"

// Shadcn UI Imports
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

// Types
interface Testimonial {
  id: number;
  name: string;
  year: number;
  quote: string;
  role: string;
  avatar: string;
}

interface NewsItem {
  id: number;
  title: string;
  category: "sekolah" | "aktivitas" | "prestasi";
  date: string;
  excerpt: string;
  image: string;
  imageGlow: string;
}

interface ProductItem {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  imageGlow: string;
  waLink: string;
}

interface AgendaItem {
  id: number;
  title: string;
  date: string;
  day: string;
  location: string;
  time: string;
}

interface Tutor {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  specialty: string;
}

interface GalleryItem {
  id: number;
  title: string;
  category: "Pembelajaran" | "Pelatihan" | "Kegiatan Luar Kelas";
  image: string;
}

function App() {
  const [backendData, setBackendData] = useState<{ message: string; status: string } | null>(null)
  
  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeNewsTab, setActiveNewsTab] = useState<"semua" | "sekolah" | "aktivitas" | "prestasi">("semua")
  const [activeAlumniTab, setActiveAlumniTab] = useState<number | "semua">("semua")
  
  // Mock Data aligned with Canva specs
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
  ]

  const agendaItems: AgendaItem[] = [
    {
      id: 1,
      title: "Ujian Pendidikan Kesetaraan Paket B",
      day: "Senin - Rabu",
      date: "25 - 27 Mei 2026",
      location: "Kampus PKBM Menuju Makmur",
      time: "07:30 - 12:00 WIB"
    },
    {
      id: 2,
      title: "Workshop Wirausaha & Kreativitas Warga Belajar",
      day: "Sabtu",
      date: "06 Juni 2026",
      location: "Aula Desa Cintanagara",
      time: "09:00 - 15:00 WIB"
    },
    {
      id: 3,
      title: "Rapat Koordinasi Tutor dan Evaluasi Semester",
      day: "Kamis",
      date: "11 Juni 2026",
      location: "Ruang Rapat Utama PKBM",
      time: "13:00 - 16:30 WIB"
    }
  ]

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
  ]

  const productItems: ProductItem[] = [
    {
      id: 1,
      name: "Kerajinan Bambu Estetik",
      price: "Rp 45.000",
      description: "Tempat pensil dan pajangan estetik ramah lingkungan buatan tangan warga belajar PKBM.",
      image: "/images/02b90792f1b8702e02039ed4a61d8420.jpg",
      imageGlow: "from-orange-500/20 to-amber-500/20",
      waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Kerajinan%20Bambu%20Estetik%20karya%20warga%20belajar."
    },
    {
      id: 2,
      name: "Kue Pengantin Premium",
      price: "Rp 250.000",
      description: "Kue hias pengantin premium yang diproduksi secara higienis oleh kelompok belajar wirausaha boga.",
      image: "/images/f94ee3cd91bec22a90625ccf63879eb4.jpg",
      imageGlow: "from-yellow-500/20 to-orange-500/20",
      waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Kue%20Pengantin%20Premium%20karya%20warga%20belajar."
    },
    {
      id: 3,
      name: "Tas & Keset Rajut Elegan",
      price: "Rp 85.000",
      description: "Tas dan keset rajutan tangan yang kuat, modis, dan dibuat dengan detail tinggi menggunakan benang rajut berkualitas.",
      image: "/images/b5212ec568f692a2bb92f8a422335d81.jpg",
      imageGlow: "from-purple-500/20 to-pink-500/20",
      waLink: "https://wa.me/6282128594025?text=Halo%20Admin%20PKBM,%20saya%20tertarik%20membeli%20Tas%20dan%20Keset%20Rajut%20Elegan%20karya%20warga%20belajar."
    }
  ]

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
  ]

  const tutors: Tutor[] = [
    {
      id: 1,
      name: "ACENG LS SUHENDI",
      role: "Tutor PJOK",
      image: "/images/633df6f47c394ce2b67bd54e4808301b.jpg",
      bio: "Berkomitmen menjaga kebugaran jasmani dan mengajarkan kedisiplinan serta pola hidup sehat kepada seluruh warga belajar PKBM Menuju Makmur.",
      specialty: "Pendidikan Jasmani, Olahraga & Kesehatan"
    },
    {
      id: 2,
      name: "H. MAMAN SUPARMAN, S.Pd.",
      role: "Tutor Bahasa Indonesia",
      image: "/images/7ccf08e706410fd4d0cde0c04b95b108.png",
      bio: "Mendidik warga belajar agar memiliki keterampilan berkomunikasi, mengapresiasi sastra, dan memahami tata bahasa Indonesia dengan baik.",
      specialty: "Bahasa & Sastra Indonesia"
    },
    {
      id: 3,
      name: "DEDEK KURNIAWAN, S.Si.",
      role: "Tutor Matematika & IPA",
      image: "/images/b8600352865365e6216298c1b2bcb4ce.png",
      bio: "Membuat pembelajaran sains dan matematika menjadi menyenangkan, logis, dan mudah dipahami oleh segala rentang usia.",
      specialty: "Matematika & Ilmu Pengetahuan Alam"
    }
  ]

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
  ]

  // Slide loop timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  // Backend status check (fetches the Elysia server hello API)
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/hello', { signal: controller.signal })
      .then(res => res.json())
      .then(data => setBackendData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to connect to backend:", err);
        }
      });
    return () => controller.abort();
  }, [])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  // Filtered Testimonials
  const filteredTestimonials = activeAlumniTab === "semua" 
    ? testimonials 
    : testimonials.filter(t => t.year === activeAlumniTab)

  // Filtered News
  const filteredNews = activeNewsTab === "semua" 
    ? newsItems 
    : newsItems.filter(n => n.category === activeNewsTab)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-[#280f91] selection:text-white">
      {/* 1. Navigation Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
              alt="PKBM Menuju Makmur"
              className="h-12 w-12"
            />
            <div>
              <span className="block text-xs font-bold tracking-widest text-[#ff6105] uppercase">Website Resmi</span>
              <span className="text-lg font-black tracking-tight text-[#280f91]">PKBM MENUJU MAKMUR</span>
            </div>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#beranda" className="text-sm font-semibold text-[#280f91] hover:text-[#ff6105] transition-colors">Beranda</a>
            <a href="#profil" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Profil</a>
            <a href="#layanan" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Layanan Digital</a>
            <a href="#agenda" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Agenda</a>
            <a href="#berita" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Berita</a>
            <a href="#produk" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Produk</a>
            <a href="#tutor" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Tutor</a>
            <a href="#alumni" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Alumni</a>
            <a href="#kontak" className="text-sm font-semibold text-slate-600 hover:text-[#280f91] transition-colors">Kontak</a>
          </nav>

          {/* E-Learning Quick Access Button */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="#layanan">
              <Button className="rounded-full bg-[#280f91] text-white hover:bg-[#ff6105] transition-all font-bold px-6 shadow-md shadow-[#280f91]/20 group">
                Portal Belajar
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden animate-in fade-in slide-in-from-top duration-300 bg-white border-b border-slate-200 px-4 py-6 space-y-4">
            <nav className="flex flex-col gap-4">
              <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-[#280f91]">Beranda</a>
              <a href="#profil" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Profil</a>
              <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Layanan Digital</a>
              <a href="#agenda" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Agenda</a>
              <a href="#berita" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Berita</a>
              <a href="#produk" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Produk Warga Belajar</a>
              <a href="#tutor" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Tutor</a>
              <a href="#alumni" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Alumni</a>
              <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-600">Kontak</a>
            </nav>
            <Separator />
            <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button className="w-full rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11">
                Akses E-Learning
              </Button>
            </a>
          </div>
        )}
      </header>

      {/* 2. Banner Ticker / Announcement (E-learning Blue theme background #e5fbff) */}
      <div className="bg-[#e5fbff] border-b border-blue-200/60 py-3.5 px-4 overflow-hidden relative">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
            <AlertCircle className="h-3.5 w-3.5" />
            Pengumuman
          </span>
          <div className="text-sm md:text-base font-bold text-[#280f91] text-center md:text-left leading-relaxed">
            📢 PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B. 
            <a href="#agenda" className="text-[#ff6105] hover:underline ml-1.5 inline-flex items-center gap-0.5">
              Lihat detail agenda <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. HERO SECTION with Canva Outline Texts and Visual Carousel */}
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all"
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
                  className={`h-3 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? "w-8 bg-[#280f91]" : "w-3 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. LAYANAN DIGITAL SECTION (High-glowing Cards, Backend Hook integrated!) */}
      <section id="layanan" className="py-24 bg-gradient-to-b from-white to-slate-50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
              Layanan Pintar
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
              Portal Layanan Digital
            </h2>
            <p className="text-slate-600 font-medium">
              Kemudahan akses administrasi, pembelajaran mandiri, dan ujian bagi seluruh warga belajar di mana saja dan kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Card 1: E-SPMB */}
            <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-purple-100 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 mb-4 group-hover:scale-110 transition-transform">
                  <BookMarked className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-[#280f91]">E-SPMB</CardTitle>
                <CardDescription className="font-semibold text-purple-700">Pendaftaran Siswa Baru</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 px-6 flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  Portal Pendaftaran Siswa Baru PKBM secara digital. Mengisi data pribadi, melampirkan berkas secara online tanpa antre.
                </p>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-purple-900 leading-relaxed">
                    Sistem otomatis mengirim notifikasi instan untuk konfirmasi berkas pendaftaran Anda.
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-xs">
                      Hubungi Admin SPMB
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[#280f91]">Pendaftaran Siswa Baru (SPMB)</DialogTitle>
                      <DialogDescription className="text-sm font-semibold text-purple-700">PKBM Menuju Makmur 2026/2027</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                        Pendaftaran siswa baru untuk Paket A, Paket B, dan Paket C dapat dilakukan dengan mudah secara online. 
                      </p>
                      <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <span className="block text-purple-950 uppercase tracking-wider text-[10px] font-black">Persyaratan Berkas:</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                          <span>Fotokopi Ijazah Terakhir (dilegalisir 3 lembar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                          <span>Fotokopi Kartu Keluarga & KTP (3 lembar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                          <span>Pas Foto ukuran 3x4 & 4x6 (masing-masing 5 lembar)</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Silakan hubungi sekretariat panitia SPMB via WhatsApp untuk mendapatkan link formulir pendaftaran digital dan panduan pengisian berkas.
                      </p>
                    </div>
                    <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl font-bold">Tutup</Button>
                      </DialogClose>
                      <a href="https://wa.me/6282128594025?text=Halo%20Admin%20PKBM%20Menuju%20Makmur,%20saya%20tertarik%20mendaftar%20sebagai%20siswa%20baru.%20Mohon%20panduan%20E-SPMB%20online." target="_blank">
                        <Button className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Daftar via WhatsApp
                        </Button>
                      </a>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            {/* Card 2: E-LEARNING (Integrated with server connection status) */}
            <Card className="overflow-hidden border-2 border-[#280f91] hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-xl relative scale-105 md:scale-105 z-10 bg-white">
              <div className="absolute top-2 right-6">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6105] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                  Aktif
                </span>
              </div>
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-[#280f91]/10 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#280f91] text-white shadow-md shadow-[#280f91]/20 mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-[#280f91]">E-LEARNING</CardTitle>
                <CardDescription className="font-semibold text-[#280f91]/80">Portal Belajar Mandiri</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 px-6 flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
                  Akses materi modul pelajaran, kuis harian, interaksi tutor-siswa, dan download bank soal secara mandiri kapan saja.
                </p>

                {/* Connection Status Hook from Elysia Backend */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Status Server E-Learning:</span>
                    {backendData ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase animate-pulse">
                        Online ✅
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                        Menghubungkan 🔄
                      </span>
                    )}
                  </div>
                  {backendData && (
                    <p className="text-[11px] font-mono text-[#280f91] italic bg-white p-2 rounded border border-slate-100">
                      "{backendData.message}"
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-md shadow-[#280f91]/20"
                    >
                      Masuk E-Learning
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[#280f91]">Akses Portal E-Learning</DialogTitle>
                      <DialogDescription className="text-sm font-semibold text-slate-500">PKBM Menuju Makmur Portal Siswa & Tutor</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                        Gunakan akun NISN (Nomor Induk Siswa Nasional) sebagai username dan kata sandi default yang diberikan oleh wali kelas Anda untuk masuk.
                      </p>
                      <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Status Server:</span>
                          <span className="font-black text-emerald-600 uppercase">Aktif (Bun/Elysia)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Kecepatan Respon:</span>
                          <span className="font-black text-[#280f91]">~ 12ms</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Jumlah Warga Belajar Aktif:</span>
                          <span className="font-black text-[#ff6150]">350+ Siswa</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#280f91] font-bold leading-relaxed bg-[#e5fbff] p-3 rounded-lg border border-blue-200/60">
                        💡 Jika Anda lupa kata sandi atau mengalami kendala login, silakan hubungi bagian IT/tutor pendamping Anda untuk reset credential.
                      </p>
                    </div>
                    <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl font-bold">Batal</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => alert("Mengarahkan ke halaman autentikasi E-Learning portal kesetaraan...")}
                        className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 shadow-md shadow-[#280f91]/20"
                      >
                        Lanjutkan Ke Login
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            {/* Card 3: E-UJIAN */}
            <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-[#280f91]">E-UJIAN</CardTitle>
                <CardDescription className="font-semibold text-emerald-700">Portal Evaluasi & Ujian</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 px-6 flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  Portal resmi pelaksanaan kuis evaluasi semester, penilaian tengah semester (PTS), serta ujian pendidikan kesetaraan akhir secara terpusat.
                </p>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-start gap-2.5">
                  <Award className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-emerald-900 leading-relaxed">
                    Sistem ujian terintegrasi dengan deteksi kecurangan dan perankingan nilai instan.
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-xs">
                      Akses Portal Ujian
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[#280f91]">Portal E-Ujian Nasional</DialogTitle>
                      <DialogDescription className="text-sm font-semibold text-emerald-700">Ujian Pendidikan Kesetaraan (UPK)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                        Sistem ujian berbasis komputer kesetaraan Paket B dan Paket C terakreditasi nasional. 
                      </p>
                      <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <span className="block text-emerald-950 uppercase tracking-wider text-[10px] font-black">Informasi Teknis:</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Wajib menggunakan browser standar modern (Chrome/Edge/Firefox)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Ujian dilengkapi dengan detektor perpindahan tab browser</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Hasil kuis langsung diunggah ke server Dapodik pusat</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Ujian sedang dinonaktifkan di luar jadwal kalender UPK. Untuk latihan soal mandiri, gunakan bank soal di portal E-Learning.
                      </p>
                    </div>
                    <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl font-bold">Tutup</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => alert("Membuka Portal Ujian Simpanan Sekolah Kesetaraan...")}
                        className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 shadow-xs"
                      >
                        Buka Ruang Ujian
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. AGENDA SECTION (Canva theme background #b5e4ed) */}
      <section id="agenda" className="py-24 bg-[#b5e4ed] border-y border-slate-300/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-white/60 rounded-full px-4 py-1.5 inline-block">
              Kalender Kegiatan
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight">
              Agenda PKBM Menuju Makmur
            </h2>
            <p className="text-slate-800 font-semibold leading-relaxed">
              Jadwal pelaksanaan kegiatan akademik, ujian pendidikan kesetaraan, lokakarya wirausaha, serta pertemuan wali murid resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {agendaItems.map((agenda) => (
              <Card key={agenda.id} className="border-0 shadow-xl overflow-hidden hover:scale-102 transition-transform duration-300 bg-white">
                {/* Header Banner */}
                <div className="bg-[#280f91] py-4 px-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#0ff60a]" />
                    <span className="text-sm font-bold">{agenda.day}</span>
                  </div>
                  <span className="text-xs font-black bg-[#ff6105] rounded-full px-3 py-1 text-white uppercase">
                    Aktif
                  </span>
                </div>
                
                <CardContent className="p-6 space-y-5">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Nama Agenda:</span>
                    <h3 className="text-lg font-black text-[#280f91] leading-tight">
                      {agenda.title}
                    </h3>
                  </div>

                  <Separator />

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-slate-400">Tanggal:</span>
                        <span className="text-sm font-bold text-[#280f91]">{agenda.date}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-slate-400">Tempat:</span>
                        <span className="text-sm font-bold text-slate-700">{agenda.location}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-slate-400">Waktu:</span>
                        <span className="text-sm font-bold text-slate-700">{agenda.time}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STATS / PROFILE SECTION */}
      <section id="profil" className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Stats Grid */}
            <div className="grid grid-cols-2 gap-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#cafc05]/20 blur-3xl rounded-full -z-10"></div>
              
              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#280f91] to-purple-600 text-white shadow-md">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">350+</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Warga Belajar</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6105] to-orange-400 text-white shadow-md">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">500+</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Lulusan Alumni</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-400 text-white shadow-md">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">18</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Tutor Kompeten</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-400 text-white shadow-md">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black text-[#280f91]">12</span>
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Rombel Kelas</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#280f91] bg-slate-100 rounded-full px-4 py-1.5 inline-block">
                Mengenal Sekolah Kami
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight">
                Membina Potensi, Menciptakan <span className="text-[#ff6105]">Masa Depan</span>
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                Pusat Kegiatan Belajar Masyarakat (PKBM) Menuju Makmur hadir di Kabupaten Ciamis sebagai wadah pendidikan nonformal terakreditasi resmi. Kami menyelenggarakan pendidikan kesetaraan Paket A (Setara SD), Paket B (Setara SMP), dan Paket C (Setara SMA) untuk membina SDM berkualitas yang mandiri dan berdaya saing.
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Materi ajar fleksibel, mudah diikuti oleh pekerja/wirausaha.
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Didukung sarana komputer modern untuk Ujian Berbasis Komputer (UNBK).
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Dibimbing oleh tenaga pengajar dan tutor tersertifikasi resmi.
                </div>
              </div>
              <div className="pt-2">
                <a href="#kontak">
                  <Button className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10">
                    Pelajari Lebih Lanjut
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NEWS / BERITA SECTION */}
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

            {/* Interactive Filters (Catatan: ada pembagian jenis berita di admin panel) */}
            <Tabs defaultValue="semua" value={activeNewsTab} onValueChange={(v) => setActiveNewsTab(v as any)} className="w-fit">
              <TabsList className="bg-slate-200/60 p-1 rounded-full flex gap-1 h-auto border border-slate-200/30">
                {(["semua", "sekolah", "aktivitas", "prestasi"] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-active:bg-[#280f91] data-active:text-white text-slate-600`}
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
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed">
                      {news.excerpt}
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Pelaksanaan kegiatan ini merupakan komitmen PKBM Menuju Makmur untuk terus meningkatkan mutu dan aksesibilitas pendidikan bagi seluruh lapisan masyarakat di Kabupaten Ciamis. Untuk info lebih lengkap, hubungi sekretariat utama kami di Cintanagara, Ciamis.
                    </p>
                  </div>
                  <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                    <DialogClose asChild>
                      <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6">
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

      {/* TUTOR SECTION */}
      <section id="tutor" className="py-24 bg-white relative border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
              Tenaga Pendidik
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
              Daftar Tutor PKBM
            </h2>
            <p className="text-slate-600 font-semibold leading-relaxed">
              Didukung oleh tutor dan tenaga pendidik yang profesional, sabar, kompeten, dan berdedikasi tinggi membantu warga belajar berkembang.
            </p>
          </div>

          {/* Tutors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tutors.map((tutor) => (
              <Dialog key={tutor.id}>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer">
                    <div className="h-64 w-full relative overflow-hidden bg-slate-100">
                      <img 
                        src={tutor.image} 
                        alt={tutor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                      <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#280f91] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-xs z-10">
                        {tutor.role}
                      </span>
                    </div>

                    <CardContent className="p-6 flex-1 space-y-2">
                      <h3 className="text-lg font-black text-[#280f91] leading-tight">
                        {tutor.name}
                      </h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Spesialisasi: {tutor.specialty}
                      </p>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-2">
                        {tutor.bio}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="p-6 pt-0">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-black text-sm text-[#ff6105] group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1.5"
                      >
                        Detail Profil Tutor
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[#280f91]">{tutor.name}</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-[#ff6105]">{tutor.role}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="h-64 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                      <img 
                        src={tutor.image} 
                        alt={tutor.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xs font-extrabold text-[#280f91] uppercase tracking-wider">Mata Pelajaran & Bidang</span>
                      <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {tutor.specialty}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xs font-extrabold text-[#280f91] uppercase tracking-wider">Biografi & Dedikasi</span>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        {tutor.bio}
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
                    <DialogClose asChild>
                      <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto">
                        Tutup Profil
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PRODUCTS SECTION (Produk Warga Belajar) */}
      <section id="produk" className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
              Etalase Produk
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
              Produk Warga Belajar
            </h2>
            <p className="text-slate-600 font-semibold leading-relaxed">
              Dukung kreativitas warga belajar dengan membeli produk karya mereka. Dibuat dengan penuh kreativitas, berkualitas, dan harga terjangkau.
            </p>
          </div>

          {/* Products Grid (omitting developer notes but adding the specified hover interactions) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {productItems.map((product) => (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer">
                    
                    {/* Visual Representation of product */}
                    <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                      
                      {/* Floating Price Tag */}
                      <span className="absolute bottom-4 right-4 inline-flex items-center rounded-lg bg-[#ff6105] px-3.5 py-1 text-sm font-black text-white shadow-md">
                        {product.price}
                      </span>
                    </div>

                    <CardContent className="p-6 flex-1 space-y-2">
                      <h3 className="text-lg font-black text-[#280f91] group-hover:text-[#ff6105] transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        {product.description}
                      </p>
                    </CardContent>

                    {/* Footer with WA link and tooltipped hover */}
                    <CardFooter className="p-6 pt-0" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a 
                            href={product.waLink} 
                            target="_blank" 
                            className="w-full relative"
                          >
                            <Button 
                              className="w-full rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="h-5 w-5" />
                              Hubungi Penjual
                            </Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 text-white font-bold py-1.5 px-3 rounded-lg shadow-xl text-xs">
                          Hubungi penjual via WhatsApp
                        </TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#280f91]">{product.name}</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-[#ff6105]">{product.price}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="h-56 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                      {product.description}
                    </p>
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-orange-900 leading-relaxed">
                        Produk ini dibuat langsung oleh kelompok wirausaha mandiri warga belajar PKBM Menuju Makmur untuk mendukung kemandirian ekonomi daerah.
                      </span>
                    </div>
                  </div>
                  <DialogFooter className="flex sm:justify-between items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-xl font-bold">Tutup</Button>
                    </DialogClose>
                    <a href={product.waLink} target="_blank">
                      <Button className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Beli via WhatsApp
                      </Button>
                    </a>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIAL ALUMNI SECTION (Interactive alumni tab filters!) */}
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

            {/* Tab Filters (Implements note: Catatan : alumni 2026 dapat di klik dan menampilkan data alumni angkatan tersebut) */}
            <div className="flex justify-center pt-4">
              <Tabs defaultValue="semua" value={String(activeAlumniTab)} onValueChange={(v) => setActiveAlumniTab(v === "semua" ? "semua" : parseInt(v))} className="w-fit">
                <TabsList className="bg-slate-200/60 p-1 rounded-full flex gap-1 h-auto border border-slate-200/30">
                  <TabsTrigger
                    value="semua"
                    className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600"
                  >
                    Semua Angkatan
                  </TabsTrigger>
                  <TabsTrigger
                    value="2026"
                    className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600"
                  >
                    Angkatan 2026
                  </TabsTrigger>
                  <TabsTrigger
                    value="2025"
                    className="rounded-full font-bold text-xs uppercase px-5 py-2 transition-all data-[state=active]:bg-[#280f91] data-[state=active]:text-white text-slate-600"
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

      {/* 10. GALLERIES SECTION */}
      <section className="py-24 bg-white relative">
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

      {/* 11. RICH CONTACT & FORM SECTION */}
      <section id="kontak" className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-5xl mx-auto items-start">
            
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
                  Informasi Kontak
                </span>
                <h2 className="text-3xl font-black text-[#280f91] tracking-tight">
                  Kontak Resmi Kami
                </h2>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  Kami siap memberikan informasi dan pelayanan kepada siswa, orang tua, serta masyarakat pada jam kerja. Silakan hubungi kami melalui kontak di bawah ini.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">Alamat Lengkap</h4>
                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                      Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara, Kecamatan Jatinagara Kab. Ciamis Prov. Jawa Barat
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">E-mail Resmi</h4>
                    <a href="mailto:admin@pkbmmenujumakmur.sch.id" className="text-blue-600 text-sm font-semibold hover:underline">
                      admin@pkbmmenujumakmur.sch.id
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">Nomor Telepon / WA</h4>
                    <a href="https://wa.me/6282128594025" className="text-slate-600 text-sm font-bold hover:text-[#280f91] transition-colors">
                      0821 2859 4025
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Google Maps Location Card */}
            <div className="lg:col-span-7">
              <Card className="shadow-2xl border-0 p-8 sm:p-10 rounded-3xl bg-white relative overflow-hidden flex flex-col justify-between h-full min-h-[480px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#b5e4ed]/30 rounded-bl-full -z-10"></div>
                
                <div className="space-y-3 mb-6">
                  <h3 className="text-xl font-black text-[#280f91]">Lokasi Lembaga & Google Maps</h3>
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    Temukan rute perjalanan terbaik atau kunjungi langsung PKBM Menuju Makmur melalui peta interaktif di bawah ini.
                  </p>
                </div>
                
                <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-50 relative aspect-[16/10] sm:aspect-[16/9]">
                  <iframe 
                    src="https://maps.google.com/maps?q=PKBM%20Menuju%20Makmur%2C%20Jatinagara%2C%20Ciamis&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Lokasi PKBM Menuju Makmur"
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                </div>
                
                <div className="mt-6 shrink-0">
                  <a 
                    href="https://maps.app.goo.gl/Hp5bXgiobn5McmL39" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block"
                  >
                    <Button className="w-full rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-12 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#280f91]/15 group">
                      <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      Buka Rute di Google Maps
                    </Button>
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 12. RICH FOOTER & COPYRIGHT */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: About */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                  <GraduationCap className="h-6 w-6 text-[#0ff60a]" />
                </div>
                <span className="text-base font-black tracking-tight text-white">PKBM MENUJU MAKMUR</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 font-medium">
                Pusat Kegiatan Belajar Masyarakat (PKBM) penyelenggara resmi program pendidikan kesetaraan terakreditasi di Kabupaten Ciamis, Jawa Barat.
              </p>
            </div>

            {/* Col 2: Program */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Program Pendidikan</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><span className="hover:text-white transition-colors">Pendidikan Paket A (Setara SD)</span></li>
                <li><span className="hover:text-white transition-colors">Pendidikan Paket B (Setara SMP)</span></li>
                <li><span className="hover:text-white transition-colors">Pendidikan Paket C (Setara SMA)</span></li>
                <li><span className="hover:text-white transition-colors">Keterampilan & Kreativitas Wirausaha</span></li>
              </ul>
            </div>

            {/* Col 3: Layanan */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Layanan Pintar</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><a href="#layanan" className="hover:text-white transition-colors">Pendaftaran Siswa (E-SPMB)</a></li>
                <li><a href="#layanan" className="hover:text-white transition-colors">Portal E-Learning Mandiri</a></li>
                <li><a href="#layanan" className="hover:text-white transition-colors">Ujian & Evaluasi (E-Ujian)</a></li>
              </ul>
            </div>

            {/* Col 4: Jam Kerja */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Jam Pelayanan</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#ff6105] shrink-0" />
                  <span>Senin - Sabtu: 08:00 - 14:00 WIB</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#ff6105] shrink-0" />
                  <span>Hari Minggu & Tanggal Merah: Libur</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="bg-slate-900" />

          {/* Bottom Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-xs font-semibold text-slate-600">
              Copyright © 2026 - Tim IT PKBM Menuju Makmur | Membangun Pendidikan, Menciptakan Masa Depan
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <a href="#beranda" className="hover:text-white transition-colors">Ke Atas</a>
              <span className="h-3 w-[1px] bg-slate-900"></span>
              <a href="#profil" className="hover:text-white transition-colors">Tentang Kami</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </TooltipProvider>
  )
}

export default App
