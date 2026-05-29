interface WelcomeBannerProps {
  userName: string;
  userRole: string;
}

export default function WelcomeBanner({ userName, userRole }: WelcomeBannerProps) {
  // Welcome header banner text based on role
  let welcomeText = "";
  if (userRole === "admin") {
    welcomeText = "Anda terhubung sebagai Administrator. Gunakan menu sebelah kiri untuk mengawasi seluruh aktivitas kesetaraan.";
  } else if (userRole === "tutor") {
    welcomeText = "Anda terhubung sebagai Tutor Pendidik. Kelola proses mengajar, unggah materi kelas digital, dan berikan evaluasi.";
  } else {
    welcomeText = "Tetap semangat mengejar masa depan gemilang! Semua aktivitas belajar, rapor, dan kuis Anda dapat diakses secara real-time.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 p-6 sm:p-8 text-white shadow-lg shadow-cyan-900/20">
      {/* Decorative shapes */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl"></div>

      <div className="relative z-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/30 border border-cyan-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">
          Sesi Aktif
        </span>
        <h2 className="text-xl sm:text-2xl font-black leading-tight">
          Selamat datang di Portal Kelas, {userName}!
        </h2>
        <p className="text-cyan-100 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
          {welcomeText}
        </p>
      </div>
    </div>
  );
}
