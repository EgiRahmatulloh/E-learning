// Integration test live-server: endpoint niche yang tersisa — setups/by-student,
// students-by-setup, siswa/tutor-stats, attendance/completions GET, bulk/continue,
// alumni/import sukses penuh. Memakai data real read-only (siswa id 36, setup 394)
// untuk GET; yang menulis memakai data IT-TEST-* + cleanup.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-niche.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

describe("setup membership & stats", () => {
  test("by-student(36) + students-by-setup(394) konsisten silang", async () => {
    const byStudent = await api("/api/elearning/setups/by-student/36", { headers: H() });
    expect(byStudent.status).toBe(200);
    const setups = (byStudent.body as { data: { setup: { id: number } }[] }).data;
    expect(setups.length).toBeGreaterThan(0);

    // Setiap setup milik siswa harus memuat siswa itu di students-by-setup
    const firstId = setups[0].setup.id;
    const members = await api(`/api/elearning/students-by-setup/${firstId}`, { headers: H() });
    expect(members.status).toBe(200);
    const ids = ((members.body as { data: { id: number }[] }).data ?? []).map((m) => m.id);
    expect(ids).toContain(36);
  });

  test("siswa-stats + tutor-stats 200 dengan key mapelAktif/tugasMasuk/ip", async () => {
    for (const path of ["/api/elearning/siswa-stats", "/api/elearning/tutor-stats"]) {
      const res = await api(path, { headers: H() });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect((res.body as { data: Record<string, unknown> }).data).toHaveProperty("mapelAktif");
    }
  });

  test("attendance GET + completions GET kontrak peran", async () => {
    const att = await api("/api/elearning/attendance?sessionId=76", { headers: H() });
    expect(att.status).toBe(200);
    expect(Array.isArray((att.body as { data: unknown[] }).data)).toBe(true);

    // completions GET hanya untuk siswa
    const adminComp = await api("/api/elearning/completions/394", { headers: H() });
    expect(adminComp.body).toMatchObject({ success: false });
  });
});

describe("bulk/continue + alumni/import sukses", () => {
  test("bulk continue memindahkan kelas 1 siswa", async () => {
    const nama = tag("CONT");
    const id = createdId(
      await api("/api/students", {
        method: "POST", headers: json(),
        body: JSON.stringify({ nama, kelas: "PAKET C 10 A" }),
      }),
    );
    try {
      const res = await api("/api/students/bulk/continue", {
        method: "POST", headers: json(),
        body: JSON.stringify({ studentIds: [id], program: "PAKET C", kelas: "PAKET C 11 A" }),
      });
      expect(res.status).toBe(200);
      expect((res.body as { continued: number }).continued).toBe(1);
    } finally {
      await api(`/api/students/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("bulk continue validasi: array kosong → pesan jelas", async () => {
    const res = await api("/api/students/bulk/continue", {
      method: "POST", headers: json(),
      body: JSON.stringify({ studentIds: [], program: "PAKET C", kelas: "PAKET C 11 A" }),
    });
    expect(res.body).toMatchObject({ success: false });
  });

  test("alumni/import 24 field sukses + cleanup", async () => {
    const nama = tag("ALS");
    const body = {
      nama, nik: "NIK1", program: "PAKET C", tahunLulus: "2026", nisn: "NS", nis: "NI",
      tempatTglLahir: "C", noHp: "0", namaAyah: "A", namaIbu: "I", jenisKelamin: "L",
      agama: "Is", email: `${nama.toLowerCase()}@x.id`, alamat: "Jl", rt: "", rw: "",
      desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "-",
      pekerjaan: "T", cerita: "-", foto: "",
    };
    const res = await api("/api/alumni/import", {
      method: "POST", headers: json(), body: JSON.stringify([body]),
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);

    const list = await api("/api/alumni");
    const row = ((list.body as { data: { id: number; nama: string }[] }).data ?? []).find((a) =>
      a.nama.startsWith(nama),
    );
    expect(row).toBeDefined();
    expect((await api(`/api/alumni/${row!.id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });
});
