import { useState } from "react";
import {
  LayoutDashboard,
  Globe,
  BookOpen,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Type,
  Megaphone,
  User,
  CalendarDays,
  Newspaper,
  Users,
  GraduationCap,
  Download,
  ShoppingBag,
  Award,
  Image,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string; icon: React.ReactNode }[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "kelola-nilai",
    label: "KELOLA NILAI & KELAS",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: "aktivitas-belajar",
    label: "AKTIVITAS BELAJAR",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: "website",
    label: "WEBSITE",
    icon: <Globe className="h-5 w-5" />,
    children: [
      { id: "slider-beranda", label: "SLIDER BERANDA", icon: <Image className="h-4 w-4" /> },
      { id: "header", label: "HEADER", icon: <Type className="h-4 w-4" /> },
      { id: "pengumuman", label: "PENGUMUMAN", icon: <Megaphone className="h-4 w-4" /> },
      { id: "website-profil", label: "PROFIL SEKOLAH", icon: <User className="h-4 w-4" /> },
      { id: "agenda", label: "AGENDA", icon: <CalendarDays className="h-4 w-4" /> },
      { id: "berita", label: "BERITA", icon: <Newspaper className="h-4 w-4" /> },
      { id: "tutor", label: "TUTOR", icon: <GraduationCap className="h-4 w-4" /> },
      { id: "warga-belajar", label: "WARGA BELAJAR", icon: <Users className="h-4 w-4" /> },
      { id: "download", label: "DOWNLOAD", icon: <Download className="h-4 w-4" /> },
      { id: "produk-wb", label: "PRODUK WB", icon: <ShoppingBag className="h-4 w-4" /> },
      { id: "alumni", label: "ALUMNI", icon: <Award className="h-4 w-4" /> },
      { id: "galeri", label: "GALERI", icon: <Image className="h-4 w-4" /> },
    ],
  },
  {
    id: "e-learning",
    label: "E-LEARNING",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: "e-ujian",
    label: "E-UJIAN",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "e-spmb",
    label: "E-SPMB",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    id: "profil",
    label: "PROFIL SAYA",
    icon: <User className="h-5 w-5" />,
  },
];

interface DashboardSidebarProps {
  userRole: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function DashboardSidebar({
  userRole,
  activeTab,
  setActiveTab,
  setMobileSidebarOpen,
}: DashboardSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const handleMenuClick = (id: string) => {
    const item = menuItems.find((m) => m.id === id);
    if (item?.children) {
      setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setActiveTab(id);
      setMobileSidebarOpen(false);
    }
  };

  // Filter sidebar menu items dynamically by role
  const filteredMenuItems = menuItems.filter((item) => {
    // Menu khusus tutor
    if (item.id === "kelola-nilai" && userRole !== "tutor") return false;
    // Menu khusus siswa
    if (item.id === "aktivitas-belajar" && userRole !== "siswa") return false;
    if (userRole !== "admin") {
      // Non-admin cannot see WEBSITE and E-SPMB
      if (item.id === "website" || item.id === "e-spmb") {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-5 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/images/2c06b6fab7e6a9490c046e362160f2d0.png"
            alt="PKBM Menuju Makmur"
            className="h-12 w-12 rounded-xl shadow-lg shadow-black/20 bg-white/10 p-0.5"
          />
          <div className="min-w-0">
            <span className="block text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">PKBM</span>
            <span className="block text-sm font-black tracking-tight text-white leading-tight">MENUJU MAKMUR</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {filteredMenuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group cursor-pointer ${
                activeTab === item.id
                  ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`transition-colors ${activeTab === item.id ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left tracking-wide">{item.label}</span>
              {item.children && (
                <span className="text-white/40">
                  {expandedMenus[item.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              )}
            </button>

            {/* Sub-menu */}
            {item.children && expandedMenus[item.id] && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3 animate-in slide-in-from-top-2 duration-200">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setActiveTab(child.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === child.id
                        ? "bg-white/15 text-cyan-300"
                        : "text-white/50 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    <span className={activeTab === child.id ? "text-cyan-300" : "text-white/30"}>{child.icon}</span>
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
