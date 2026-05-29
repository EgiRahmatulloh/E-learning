export interface Testimonial {
  id: number;
  name: string;
  year: number;
  quote: string;
  role: string;
  avatar: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category: "sekolah" | "aktivitas" | "prestasi";
  date: string;
  excerpt: string;
  image: string;
  imageGlow: string;
}

export interface ProductItem {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  imageGlow: string;
  waLink: string;
}

export interface AgendaItem {
  id: number;
  title: string;
  date: string;
  day: string;
  location: string;
  time: string;
}

export interface Tutor {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  specialty: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: "Pembelajaran" | "Pelatihan" | "Kegiatan Luar Kelas";
  image: string;
}
