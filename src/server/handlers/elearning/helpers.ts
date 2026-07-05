/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper: verify any authenticated user (siswa, tutor, admin, super_admin)
export const verifyUser = async (headers: Record<string, string | undefined>, jwt: any, set: any) => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(" ")[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { success: false, message: "Sesi Anda telah kedaluwarsa, silakan masuk kembali" };
  }
  return null; // valid
};

// Helper: sanitize a string for use in Content-Disposition filename
export const sanitizeFilename = (s: string): string =>
  s.replace(/[^a-zA-Z0-9._\-\s]/g, "_").replace(/\s+/g, "_");

// Helper: derive program from class name
export const deriveProgram = (kelas: string): string => {
  const upper = kelas.toUpperCase();
  if (upper.includes("PAKET A")) return "Paket A";
  if (upper.includes("PAKET B")) return "Paket B";
  return "Paket C";
};

// Helper: build monthly attendance grid (d1..d31)
export const buildAttendanceGrid = (
  items: any[],
  dateAccessor: (item: any) => string | null | undefined,
  currentMonth: number,
  currentYear: number,
  daysInMonth: number,
  sessionDates: Set<number> | null = null // Set of days in the month where a session occurred. If null, uses Tutor format (✓)
): { dayData: Record<string, string>; rekap: number } => {
  const dayData: Record<string, string> = {};
  let rekap = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const hasActivity = items.some(item => {
      const raw = dateAccessor(item);
      if (!raw) return false;
      const dt = new Date(raw);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear && dt.getDate() === d;
    });

    if (sessionDates === null) {
      // Tutor mode: output ✓ or empty
      dayData["d" + d] = hasActivity ? "✓" : "";
      if (hasActivity) rekap++;
    } else {
      // Student mode: output H, A, or -
      if (hasActivity) {
        dayData["d" + d] = "H";
        rekap++;
      } else if (sessionDates.has(d)) {
        dayData["d" + d] = "A";
      } else {
        dayData["d" + d] = "-";
      }
    }
  }
  return { dayData, rekap };
};

// Helper: calculate final grade from components
export const calculateGrade = (kehadiran: number, partisipasi: number, tugas: number) => {
  const final = (kehadiran * 0.2) + (partisipasi * 0.3) + (tugas * 0.5);
  const predikat = final >= 85 ? "A" : final >= 70 ? "B" : final >= 55 ? "C" : final >= 40 ? "D" : "E";
  return { final: Math.round(final * 10) / 10, predikat };
};

