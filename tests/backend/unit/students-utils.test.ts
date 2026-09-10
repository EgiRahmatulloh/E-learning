// Uji unit untuk helper murni di src/server/handlers/students.ts:
// deriveProgramFromKelas (dipakai saat impor & simpan siswa agar program
// selalu konsisten dengan nama kelas).
// Handler Elysia-nya sendiri butuh DB sehingga tidak diuji di sini.
// Jalankan: bun run test:be:unit
import { describe, expect, test } from "bun:test";

// students.ts → jwt.ts melempar bila JWT_SECRET hilang. bun test tidak selalu
// memuat .env.local, jadi pasang fallback untuk sesi test saja (sama seperti
// tests/storage.test.ts). Wajib dynamic import: import statis di-hoist dan
// dievaluasi SEBELUM baris di bawah ini jalan, sehingga fallback-nya telat.
if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "test-secret-untuk-unit-test";

const { deriveProgramFromKelas } = await import("../../../src/server/handlers/students");

describe("deriveProgramFromKelas", () => {
  test("mengenali Paket A/B/C dari awalan (case-insensitive)", () => {
    expect(deriveProgramFromKelas("PAKET A 1")).toBe("PAKET A");
    expect(deriveProgramFromKelas("paket b 8 a")).toBe("PAKET B");
    expect(deriveProgramFromKelas("Paket C 10")).toBe("PAKET C");
  });

  test("string kosong/null → string kosong (bukan default Paket C)", () => {
    expect(deriveProgramFromKelas("")).toBe("");
    expect(deriveProgramFromKelas(null)).toBe("");
    expect(deriveProgramFromKelas(undefined)).toBe("");
  });

  test("format lama → string kosong (harus dinormalisasi dulu)", () => {
    expect(deriveProgramFromKelas("KELAS X")).toBe("");
    expect(deriveProgramFromKelas("10A")).toBe("");
  });
});
