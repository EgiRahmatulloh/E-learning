import { useState, useEffect, useCallback } from 'react';
import './App.css';
import DashboardPage from "@/components/dashboard/DashboardPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Landing Page Components
import Header from "./components/landing/Header";
import Ticker from "./components/landing/Ticker";
import Hero from "./components/landing/Hero";
import Services from "./components/landing/Services";
import Agenda from "./components/landing/Agenda";
import Profile from "./components/landing/Profile";
import News from "./components/landing/News";
import Tutors from "./components/landing/Tutors";
import Products from "./components/landing/Products";
import Testimonials from "./components/landing/Testimonials";
import Gallery from "./components/landing/Gallery";
import Contact from "./components/landing/Contact";
import Footer from "./components/landing/Footer";
import LoginModal from "./components/landing/LoginModal";

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
  const [user, setUser] = useState<{ id: number; name: string; username: string; role: string } | null>(getLocalStorageUser());
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
    if (user && currentPath === "/") {
      navigate("/dashboard");
    } else if (!user && currentPath === "/dashboard") {
      navigate("/");
    }
  }, [user, currentPath]);

  // Verify token on mount/change with AbortController cleanup
  useEffect(() => {
    if (!token) return;

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
    });

    return () => controller.abort();
  }, [token]);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal masuk");
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setLoginDialogOpen(false);
        setLoginUsername("");
        setLoginPassword("");
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Koneksi ke server gagal";
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (user && currentPath === "/dashboard") {
    return (
      <TooltipProvider>
        <DashboardPage user={user} handleLogout={handleLogout} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-[#280f91] selection:text-white ${
        currentPath === "/profile" ? "animate-in fade-in duration-300" : ""
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
        ) : (
          <>
            <Hero onServiceClick={(service) => setActiveServiceDialog(service)} />
            
            <Services
              onLoginClick={() => setLoginDialogOpen(true)}
              activeDialog={activeServiceDialog}
              onDialogClose={() => setActiveServiceDialog(null)}
            />
            
            <Ticker />
            
            <Agenda isDetailed={false} onNavigate={navigate} />
            
            <Profile isDetailed={false} onNavigate={navigate} />
            
            <News isDetailed={false} onNavigate={navigate} />
            
            <Tutors isDetailed={false} onNavigate={navigate} />
            
            <Products />
            
            <Testimonials />
            
            <Gallery />
            
            <Contact />
          </>
        )}
        
        <Footer />

        <LoginModal
          isOpen={loginDialogOpen}
          onOpenChange={(open) => {
            setLoginDialogOpen(open);
            if (!open) {
              setLoginError("");
              setLoginUsername("");
              setLoginPassword("");
            }
          }}
          onSubmit={handleLogin}
          loginUsername={loginUsername}
          setLoginUsername={setLoginUsername}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          loginError={loginError}
          loginLoading={loginLoading}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
