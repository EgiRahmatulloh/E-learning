// Uji unit untuk src/server/handlers/elearning/helpers.ts — helper murni
// (tanpa DB) yang dipakai semua endpoint laporan e-learning: grid absensi
// bulanan d1..d31, kalkulasi nilai akhir + predikat, tahun ajaran, parsing
// tanggal WIB, dan util nama file/kelas.
// Jalankan: bun test tests/elearning-helpers.test.ts
import { describe, expect, test } from "bun:test";
import {
  buildAttendanceGrid,
  calculateGrade,
  deriveProgram,
  extractLevel,
  extractSub,
  getTahunAjaran,
  sanitizeFilename,
  toJakartaDate,
  verifyUser,
} from "../src/server/handlers/elearning/helpers";

// --- jwt stub: verify(token) → payload | null ---
const jwtOk = (payload: unknown = { id: 1 }) => ({
  verify: async (t: string) => (t === "valid" ? payload : null),
});
const makeSet = () => ({ status: 200 }) as { status: number };

describe("verifyUser", () => {
  test("lolos dengan Bearer token valid", async () => {
    expect(
      await verifyUser({ authorization: "Bearer valid" }, jwtOk(), makeSet()),
    ).toBeNull();
  });

  test("401 bila header hilang / bukan Bearer", async () => {
    const set = makeSet();
    expect(await verifyUser({}, jwtOk(), set)).toMatchObject({ success: false });
    expect(set.status).toBe(401);
    const set2 = makeSet();
    await verifyUser({ authorization: "Token x" }, jwtOk(), set2);
    expect(set2.status).toBe(401);
  });

  test("401 bila token tidak bisa diverifikasi", async () => {
    const set = makeSet();
    const res = await verifyUser({ authorization: "Bearer basi" }, jwtOk(), set);
    expect(res).toMatchObject({ success: false });
    expect(set.status).toBe(401);
  });
});

describe("sanitizeFilename", () => {
  test("karakter berbahaya diganti underscore", () => {
    expect(sanitizeFilename("lap/hadir:oke?.xlsx")).toBe("lap_hadir_oke_.xlsx");
  });

  test("spasi beruntun menjadi satu underscore", () => {
    expect(sanitizeFilename("daftar  hadir  tutor")).toBe("daftar_hadir_tutor");
  });

  test("nama aman tidak berubah", () => {
    expect(sanitizeFilename("NILAI_C-10_A.xlsx")).toBe("NILAI_C-10_A.xlsx");
  });
});

describe("deriveProgram", () => {
  test("mengenali Paket A/B dari awalan kelas (case-insensitive)", () => {
    expect(deriveProgram("PAKET A 1")).toBe("Paket A");
    expect(deriveProgram("paket b 8 a")).toBe("Paket B");
  });

  test("default Paket C untuk kosong/tak dikenal", () => {
    expect(deriveProgram("")).toBe("Paket C");
    expect(deriveProgram("PAKET C 10")).toBe("Paket C");
    expect(deriveProgram("KELAS X")).toBe("Paket C");
  });
});

describe("extractLevel / extractSub", () => {
  test("level & sub dari nama kelas baru", () => {
    expect(extractLevel("PAKET C 12 B")).toBe(12);
    expect(extractSub("PAKET C 12 B")).toBe("B");
  });

  test("tanpa angka/sub → 0 / string kosong", () => {
    expect(extractLevel("PAKET C")).toBe(0);
    expect(extractSub("PAKET B 8")).toBe("");
  });
});

describe("toJakartaDate", () => {
  test("YYYY-MM-DD diurai langsung tanpa geser zona waktu", () => {
    expect(toJakartaDate("2025-09-10")).toEqual({ year: 2025, month: 8, day: 10 });
    // tengah malam UTC tetap tanggal yang sama, bukan mundur sehari
    expect(toJakartaDate("2025-01-01")).toMatchObject({ year: 2025, month: 0, day: 1 });
  });

  test("ISO datetime dikonversi ke WIB (Asia/Jakarta)", () => {
    // 2025-09-09T18:00:00Z = 2025-09-10 01:00 WIB
    expect(toJakartaDate("2025-09-09T18:00:00.000Z")).toEqual({
      year: 2025,
      month: 8,
      day: 10,
    });
  });
});

describe("buildAttendanceGrid mode tutor (sessionDates = null)", () => {
  const items = [
    { attendedAt: "2025-09-05", signature: "data:sig-5" },
    { attendedAt: "2025-09-20" },
  ];
  const grid = buildAttendanceGrid(items, (i) => i.attendedAt, 8, 2025, 30);

  test("tanggal hadir bertanda ✓ + rekap dihitung", () => {
    expect(grid.dayData.d5).toBe("✓");
    expect(grid.dayData.d20).toBe("✓");
    expect(grid.rekap).toBe(2);
  });

  test("tanggal tanpa kegiatan kosong", () => {
    expect(grid.dayData.d1).toBe("");
    expect(grid.dayData.d30).toBe("");
  });

  test("signature diteruskan per tanggal", () => {
    expect(grid.signatureData.d5).toBe("data:sig-5");
    expect(grid.signatureData.d20).toBe("");
    expect(grid.signatureData.d1).toBe("");
  });

  test("kegiatan beda bulan/tahun diabaikan", () => {
    const g2 = buildAttendanceGrid(
      [{ attendedAt: "2025-08-05" }],
      (i) => i.attendedAt,
      8, 2025, 30,
    );
    expect(g2.dayData.d5).toBe("");
    expect(g2.rekap).toBe(0);
  });
});

describe("buildAttendanceGrid mode siswa (sessionDates terisi)", () => {
  const grid = buildAttendanceGrid(
    [{ attendedAt: "2025-09-05", signature: "data:sig" }],
    (i) => i.attendedAt, 8, 2025, 30, new Set([5, 6]),
  );

  test("hadir = H, absen = -", () => {
    expect(grid.dayData.d5).toBe("H");
    expect(grid.dayData.d6).toBe("-");
  });

  test("rekap hanya menghitung kehadiran", () => {
    expect(grid.rekap).toBe(1);
  });

  test("signature hanya untuk tanggal hadir", () => {
    expect(grid.signatureData.d5).toBe("data:sig");
    expect(grid.signatureData.d6).toBe("");
  });
});

describe("calculateGrade", () => {
  test("bobot 20/30/50 dan pembulatan 1 desimal", () => {
    // 80*.2 + 70*.3 + 90*.5 = 16+21+45 = 82
    expect(calculateGrade(80, 70, 90)).toEqual({ final: 82, predikat: "B" });
    // 33.3*.2 + 66.6*.3 + 99.9*.5 = 6.66+19.98+49.95 = 76.59 → 76.6
    expect(calculateGrade(33.3, 66.6, 99.9).final).toBe(76.6);
  });

  test("batas predikat A/B/C/D/E", () => {
    expect(calculateGrade(85, 85, 85).predikat).toBe("A");
    expect(calculateGrade(84.9, 84.9, 84.9).predikat).toBe("B");
    expect(calculateGrade(70, 70, 70).predikat).toBe("B");
    expect(calculateGrade(69.9, 69.9, 69.9).predikat).toBe("C");
    expect(calculateGrade(55, 55, 55).predikat).toBe("C");
    expect(calculateGrade(54.9, 54.9, 54.9).predikat).toBe("D");
    expect(calculateGrade(40, 40, 40).predikat).toBe("D");
    expect(calculateGrade(39.9, 39.9, 39.9).predikat).toBe("E");
  });

  test("nol semua → E", () => {
    expect(calculateGrade(0, 0, 0)).toEqual({ final: 0, predikat: "E" });
  });
});

describe("getTahunAjaran", () => {
  test("Juli ke atas = tahun berjalan/tahun+1", () => {
    expect(getTahunAjaran(new Date(2025, 6, 1))).toBe("2025/2026");
    expect(getTahunAjaran(new Date(2025, 11, 31))).toBe("2025/2026");
  });

  test("di bawah Juli = tahun-1/tahun berjalan", () => {
    expect(getTahunAjaran(new Date(2025, 5, 30))).toBe("2024/2025");
    expect(getTahunAjaran(new Date(2026, 0, 1))).toBe("2025/2026");
  });
});
