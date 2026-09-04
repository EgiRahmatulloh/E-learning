import { useState, useEffect, useCallback } from 'react';
import './App.css';
import DashboardPage from "@/components/dashboard/DashboardPage";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// Landing Page Components
import Header from "./components/landing/Header";
import Ticker from "./components/landing/Ticker";
import Hero from "./components/landing/Hero";
import Services from "./components/landing/Services";
import Agenda from "./components/landing/Agenda";
import Profile from "./components/landing/Profile";
import News from "./components/landing/News";
import Tutors from "./components/landing/Tutors";
import WargaBelajar from "./components/landing/WargaBelajar";
import DownloadPage from "./components/landing/DownloadPage";
import ProductsPage from "./components/landing/ProductsPage";
import AlumniPage from "./components/landing/AlumniPage";
import GalleryPage from "./components/landing/GalleryPage";
import Products from "./components/landing/Products";
import Testimonials from "./components/landing/Testimonials";
import Gallery from "./components/landing/Gallery";
import Footer from "./components/landing/Footer";

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
    <div className="relative flex items-center justify-center">
      <div className="absolute h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="h-16 w-16 rounded-full border-4 border-[#280f91] border-t-transparent animate-spin"></div>
      <img src="/images/2c06b6fab7e6a9490c046e362160f2d0.png" alt="Logo" className="absolute h-6 w-6 object-contain" />
    </div>
    <div className="text-[#280f91] font-bold animate-pulse text-sm">Memuat sesi Anda...</div>
  </div>
);

function App() {

  const [activeServiceDialog, setActiveServiceDialog] = useState<"e-spmb" | "e-learning" | "e-ujian" | null>(null);

  // Authentication States
  const getLocalStorageUser = (): { id: number; name: string; username: string; role: string } | null => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse user session from localStorage:", e);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  };

  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<{ id: number; name: string; username: string; role: string; kelas?: string; program?: string } | null>(getLocalStorageUser());
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(!!localStorage.getItem("token"));

  // URL Path State for SPA Routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Listen to browser navigation changes (e.g. back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  }, []);

  // Auth route guards to keep URL & login state in sync
  useEffect(() => {
    if (isAuthChecking) return;
    if (user && currentPath === "/") {
      navigate("/dashboard");
    } else if (!user && currentPath.startsWith("/dashboard")) {
      navigate("/");
    }
  }, [user, currentPath, isAuthChecking]);

  // Verify token on mount/change with AbortController cleanup
  useEffect(() => {
    if (!token) {
      setIsAuthChecking(false);
      return;
    }

    const controller = new AbortController();
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error("Expired session");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      })
      .finally(() => {
        setIsAuthChecking(false);
      });

    return () => controller.abort();
  }, [token]);



  // Dipanggil oleh Services setelah login berhasil dari dialog e-learning.
  // Mengangkat state auth ke App agar tidak perlu window.location.reload().
  const handleAuthSuccess = useCallback((newToken: string, newUser: { id: number; name: string; username: string; role: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setActiveServiceDialog(null);
    navigate("/dashboard");
  }, [navigate]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setActiveServiceDialog(null);
    navigate("/");
  };

  if (isAuthChecking) {
    return <LoadingScreen />;
  }

  if (user && currentPath.startsWith("/dashboard")) {
    return (
      <TooltipProvider>
        <Toaster />
        <DashboardPage user={user} handleLogout={handleLogout} setUser={setUser} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <div className={`min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-[#280f91] selection:text-white ${currentPath === "/profile" ? "animate-in fade-in duration-300" : ""
        }`}>
        <Header currentPath={currentPath} onNavigate={navigate} />

        {currentPath === "/profile" ? (
          <div className="pt-20">
            <Profile isDetailed={true} onNavigate={navigate} />
          </div>
        ) : currentPath === "/agenda" ? (
          <div className="pt-20">
            <Agenda isDetailed={true} onNavigate={navigate} />
          </div>
        ) : currentPath === "/news" ? (
          <div className="pt-20">
            <News isDetailed={true} onNavigate={navigate} />
          </div>
        ) : currentPath === "/tutor" ? (
          <div className="pt-20">
            <Tutors isDetailed={true} onNavigate={navigate} />
          </div>
        ) : currentPath === "/warga-belajar" ? (
          <div className="pt-20">
            <WargaBelajar onNavigate={navigate} />
          </div>
        ) : currentPath === "/download" ? (
          <div className="pt-20">
            <DownloadPage onNavigate={navigate} />
          </div>
        ) : currentPath === "/produk-wb" ? (
          <div className="pt-20">
            <ProductsPage />
          </div>
        ) : currentPath === "/alumni" ? (
          <div className="pt-20">
            <AlumniPage onNavigate={navigate} />
          </div>
        ) : currentPath === "/galeri" ? (
          <div className="pt-20">
            <GalleryPage onNavigate={navigate} />
          </div>
        ) : (
          <>
            <Hero onServiceClick={(service) => setActiveServiceDialog(service)} />

            <Services
              onLoginSuccess={handleAuthSuccess}
              activeDialog={activeServiceDialog}
              onDialogClose={() => setActiveServiceDialog(null)}
            />

            <Ticker />

            <Profile isDetailed={false} onNavigate={navigate} />

            <Agenda isDetailed={false} onNavigate={navigate} />

            <News isDetailed={false} onNavigate={navigate} />

            <Tutors isDetailed={false} onNavigate={navigate} />

            <Products />

            <Testimonials />

            <Gallery />
          </>
        )}

        <Footer />
      </div>
    </TooltipProvider>
  );
}

export default App;
