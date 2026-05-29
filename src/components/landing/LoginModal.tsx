import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, GraduationCap } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  loginLoading: boolean;
}

export default function LoginModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  loginLoading
}: LoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[#280f91]/20 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="mx-auto p-3 bg-[#280f91]/10 rounded-2xl text-[#280f91] w-fit mb-2">
            <GraduationCap className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-[#280f91] text-center">Masuk ke Portal Belajar</DialogTitle>
          <DialogDescription className="text-slate-500 text-center font-medium">
            Gunakan akun default per role untuk mencoba fitur dashboard kesetaraan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in shake duration-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="login-username" className="text-xs font-black text-slate-700 uppercase tracking-widest block">Username atau Email</label>
            <input
              id="login-username"
              type="text"
              required
              placeholder="Contoh: admin, tutor, atau siswa"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#280f91] transition-all bg-slate-50/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-black text-slate-700 uppercase tracking-widest block">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#280f91] transition-all bg-slate-50/50"
            />
          </div>

          {import.meta.env.DEV && (
            <div className="bg-[#e5fbff] border border-blue-100 rounded-xl p-3 text-[11px] font-semibold text-blue-700 space-y-1">
              <span className="block font-black text-xs text-[#280f91] uppercase tracking-wider mb-1">🔑 Info Akun Dummy (Seed):</span>
              <span className="block">• <strong>Admin:</strong> admin / admin123</span>
              <span className="block">• <strong>Tutor:</strong> tutor / tutor123</span>
              <span className="block">• <strong>Siswa:</strong> siswa / siswa123</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loginLoading}
            className="w-full h-12 bg-[#280f91] text-white hover:bg-[#ff6105] font-black rounded-xl shadow-md transition-all mt-4 cursor-pointer"
          >
            {loginLoading ? "Memproses..." : "Masuk Sekarang"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
