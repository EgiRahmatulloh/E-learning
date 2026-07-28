export const extractLevel = (nama: string): number => {
  const m = nama.match(/PAKET\s+[ABC]\s+(\d+)/i);
  return m ? parseInt(m[1]) : 0;
};

export const extractSub = (nama: string): string => {
  const m = nama.match(/PAKET\s+[ABC]\s+\d+\s+([A-Z])$/i);
  return m ? m[1] : "";
};

export const buildNamaKelas = (paket: string, level: number, sub?: string): string => {
  const base = `PAKET ${paket.toUpperCase()} ${level}`;
  return sub ? `${base} ${sub.toUpperCase()}` : base;
};

export const PROGRAM_LEVELS: Record<string, { min: number; max: number; label: string }> = {
  A: { min: 1, max: 6, label: "PAKET A (SD)" },
  B: { min: 7, max: 9, label: "PAKET B (SMP)" },
  C: { min: 10, max: 12, label: "PAKET C (SMA)" },
};

export const normalizeKelasName = (rawKelas: string): { kelas: string; program: string } => {
  if (!rawKelas) return { kelas: "", program: "" };
  const str = rawKelas.trim();

  // If already in new format "PAKET C 10 A" or "PAKET B 8"
  const mNew = str.match(/^PAKET\s+([ABC])\s+(\d+)(?:\s+([A-Z]))?$/i);
  if (mNew) {
    const paket = mNew[1].toUpperCase();
    const level = parseInt(mNew[2]);
    const sub = mNew[3] ? mNew[3].toUpperCase() : undefined;
    return {
      kelas: buildNamaKelas(paket, level, sub),
      program: `PAKET ${paket}`,
    };
  }

  // Handle old format: KELAS X, KELAS 10, XA, 10A, etc.
  const mRoman = str.match(/^(?:KELAS\s+)?(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|\d{1,2})\s*([A-Z])?$/i);
  if (mRoman) {
    const romanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
      VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
    };
    const levelStr = mRoman[1].toUpperCase();
    const levelNum = romanMap[levelStr] || parseInt(levelStr) || 0;
    const sub = mRoman[2] ? mRoman[2].toUpperCase() : undefined;

    if (levelNum >= 1 && levelNum <= 12) {
      const paket = levelNum <= 6 ? "A" : levelNum <= 9 ? "B" : "C";
      return {
        kelas: buildNamaKelas(paket, levelNum, sub),
        program: `PAKET ${paket}`,
      };
    }
  }

  return { kelas: str, program: str.includes("PAKET A") ? "PAKET A" : str.includes("PAKET B") ? "PAKET B" : str.includes("PAKET C") ? "PAKET C" : "" };
};