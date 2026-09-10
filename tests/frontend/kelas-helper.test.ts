// Uji unit untuk src/lib/kelas-helper.ts — normalisasi nama kelas & program.
// Jalankan: bun run test:fe
import { describe, expect, test } from "bun:test";
import {
  buildNamaKelas,
  extractLevel,
  extractSub,
  normalizeKelasName,
  PROGRAM_LEVELS,
} from "../../src/lib/kelas-helper";

describe("extractLevel", () => {
  test("mengekstrak angka level dari nama kelas baru", () => {
    expect(extractLevel("PAKET C 10 A")).toBe(10);
    expect(extractLevel("PAKET B 8")).toBe(8);
    expect(extractLevel("paket a 1")).toBe(1);
  });

  test("mengembalikan 0 bila tidak cocok", () => {
    expect(extractLevel("KELAS X")).toBe(0);
    expect(extractLevel("")).toBe(0);
    expect(extractLevel("PAKET C")).toBe(0);
  });
});

describe("extractSub", () => {
  test("mengekstrak huruf section", () => {
    expect(extractSub("PAKET C 10 A")).toBe("A");
    expect(extractSub("paket b 8 c")).toBe("c");
  });

  test("mengembalikan string kosong bila tanpa section", () => {
    expect(extractSub("PAKET B 8")).toBe("");
    expect(extractSub("KELAS X")).toBe("");
    expect(extractSub("")).toBe("");
  });
});

describe("buildNamaKelas", () => {
  test("menyusun nama dengan dan tanpa sub", () => {
    expect(buildNamaKelas("C", 10, "A")).toBe("PAKET C 10 A");
    expect(buildNamaKelas("B", 8)).toBe("PAKET B 8");
  });

  test("menormalkan huruf kecil ke kapital", () => {
    expect(buildNamaKelas("c", 10, "a")).toBe("PAKET C 10 A");
  });
});

describe("PROGRAM_LEVELS", () => {
  test("rentang level tiap paket benar", () => {
    expect(PROGRAM_LEVELS.A).toMatchObject({ min: 1, max: 6 });
    expect(PROGRAM_LEVELS.B).toMatchObject({ min: 7, max: 9 });
    expect(PROGRAM_LEVELS.C).toMatchObject({ min: 10, max: 12 });
  });
});

describe("normalizeKelasName", () => {
  test("format baru dipertahankan (dengan normalisasi kapital)", () => {
    expect(normalizeKelasName("paket c 10 a")).toEqual({
      kelas: "PAKET C 10 A",
      program: "PAKET C",
    });
    expect(normalizeKelasName("PAKET B 8")).toEqual({
      kelas: "PAKET B 8",
      program: "PAKET B",
    });
  });

  test("format lama romawi dikonversi ke format baru", () => {
    // X = level 10 → PAKET C
    expect(normalizeKelasName("KELAS X")).toEqual({
      kelas: "PAKET C 10",
      program: "PAKET C",
    });
    // VIII A = level 8 sub A → PAKET B 8 A
    expect(normalizeKelasName("VIII A")).toEqual({
      kelas: "PAKET B 8 A",
      program: "PAKET B",
    });
    // VI = level 6 → PAKET A
    expect(normalizeKelasName("KELAS VI")).toEqual({
      kelas: "PAKET A 6",
      program: "PAKET A",
    });
  });

  test("format lama angka dikonversi (10A → PAKET C 10 A)", () => {
    expect(normalizeKelasName("10A")).toEqual({
      kelas: "PAKET C 10 A",
      program: "PAKET C",
    });
    expect(normalizeKelasName("KELAS 7")).toEqual({
      kelas: "PAKET B 7",
      program: "PAKET B",
    });
  });

  test("string asing dikembalikan apa adanya dengan tebakan program", () => {
    expect(normalizeKelasName("Kelas Khusus PAKET A")).toMatchObject({ program: "PAKET A" });
    expect(normalizeKelasName("Belajar PAKET B sore")).toMatchObject({ program: "PAKET B" });
    expect(normalizeKelasName("Kursus Bahasa")).toEqual({ kelas: "Kursus Bahasa", program: "" });
  });

  test("string kosong aman", () => {
    expect(normalizeKelasName("")).toEqual({ kelas: "", program: "" });
  });
});
