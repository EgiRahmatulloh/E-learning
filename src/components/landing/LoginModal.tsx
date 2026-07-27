import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in shake duration-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="login-username" className="text-xs font-black text-slate-700 uppercase tracking-widest block">Email</label>
            <input
              id="login-username"
              name="username"
              type="email"
              autoComplete="username"
              required
              placeholder="Masukkan alamat email"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#280f91] transition-all bg-slate-50/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-black text-slate-700 uppercase tracking-widest block">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#280f91] transition-all bg-slate-50/50"
            />
          </div>


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
