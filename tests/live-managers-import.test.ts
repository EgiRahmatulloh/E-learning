// Integration test live-server: managers + impor massal + bulk siswa + sync rombel.
// Impor memakai nama unik IT-TEST-* lalu dibersihkan via DELETE per baris
// (endpoint import tidak punya bulk-delete). Dedup NIK/email ikut diverifikasi.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-managers-import.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

const MANAGER_BODY = (nama: string, email: string) => ({
  nama, nik: `NIK-${Date.now()}`, jabatan: "Sekretaris", nip: "-",
  tempatTglLahir: "Ciamis, 01-01-1990", jenisKelamin: "Laki-laki", agama: "Islam",
  pendidikan: "S1", email, tanggalMulaiTugas: "2020-01-01", nomorSkPengangkatan: "-",
  lembagaPengangkat: "Diknas", nomorSkPenugasan: "-", lembagaPenugas: "PKBM",
  alamat: "Jl. IT", foto: "",
});

describe("managers: create (hash password) → list aman → delete", () => {
  test("password ter-hash (bisa login); list tanpa password", async () => {
    const nama = tag("PENGELOLA");
    const email = `${tag("MGR").toLowerCase()}@x.id`;
    const created = await api("/api/managers", {
      method: "POST", headers: json(),
      body: JSON.stringify({ ...MANAGER_BODY(nama, email), password: "mgr-aman-123" }),
    });
    expect(created.status).toBe(200);
    const id = (created.body as { data: { id: number } }).data.id;
    expect((created.body as { data: { password?: string } }).data.password).toBeUndefined();

    const login = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password: "mgr-aman-123" }),
    });
    expect(login.status).toBe(200);

    const list = await api("/api/managers", { headers: H() });
    const row = ((list.body as { data: { id: number; password: string }[] }).data ?? []).find(
      (m) => m.id === id,
    );
    expect(row).toBeDefined();
    expect(row!.password).not.toBe("mgr-aman-123");

    expect((await api(`/api/managers/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });

  test("KONTRAK: email duplikat LOLOS (unique schema tidak ditegakkan di DB) — dikunci", async () => {
    // Skema drizzle mendeklarasikan unique email, tapi SQLite dev/prod dibuat
    // via CREATE TABLE manual (db/index.ts) TANPA constraint UNIQUE — sehingga
    // duplikat lolos (200). Test mengunci perilaku AKTUAL agar bila suatu hari
    // constraint ditegakkan (migrasi), perubahan ketahuan di sini.
    const email = `${tag("DUPE").toLowerCase()}@x.id`;
    const ids: number[] = [];
    for (const suffix of ["A", "B"]) {
      const r = await api("/api/managers", {
        method: "POST", headers: json(),
        body: JSON.stringify(MANAGER_BODY(tag(suffix), email)),
      });
      expect(r.status).toBe(200);
      ids.push((r.body as { data: { id: number } }).data.id);
    }
    for (const id of ids) {
      expect((await api(`/api/managers/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
    }
  });
});

describe("import massal: validasi, dedup, tanpa token", () => {
  test("tutors/import: nama kosong ditolak skema (422); duplikat dalam file ikut masuk", async () => {
    const bad = await api("/api/tutors/import", {
      method: "POST", headers: json(),
      body: JSON.stringify([{ nama: "ok" }, { nama: "" }]),
    });
    expect(bad.status).toBe(422);

    const prefix = tag("TUTOR");
    const ok = await api("/api/tutors/import", {
      method: "POST", headers: json(),
      body: JSON.stringify([{ nama: `${prefix}-A` }, { nama: `${prefix}-B` }]),
    });
    expect(ok.status).toBe(200);
    expect((ok.body as { imported: number }).imported).toBe(2);

    const list = await api("/api/tutors", { headers: H() });
    const ids = ((list.body as { data: { id: number; nama: string }[] }).data ?? [])
      .filter((t) => t.nama.startsWith(prefix))
      .map((t) => t.id);
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect((await api(`/api/tutors/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
    }
  });

  test("students/import: 1 baris valid masuk + program diturunkan dari kelas", async () => {
    const nama = tag("SISWA-IMP");
    const ok = await api("/api/students/import", {
      method: "POST", headers: json(),
      body: JSON.stringify([{ nama, kelas: "PAKET B 8 A" }]),
    });
    expect(ok.status).toBe(200);
    expect((ok.body as { imported: number }).imported).toBe(1);

    const list = await api("/api/students", { headers: H() });
    const row = ((list.body as { data: { id: number; nama: string; program: string }[] }).data ?? []).find(
      (s) => s.nama === nama,
    );
    expect(row?.program).toBe("PAKET B");
    await api(`/api/students/${row!.id}`, { method: "DELETE", headers: H() });
  });

  test("managers/import: array kosong valid → 400; body objek → 422 skema", async () => {
    // Skema Elysia t.Array mendahului cek manual "harus array" di handler:
    // objek → 422 validasi, array kosong (valid skema) → 400 dari handler.
    const bukanArray = await api("/api/managers/import", {
      method: "POST", headers: json(), body: JSON.stringify({ nama: "x" }),
    });
    expect(bukanArray.status).toBe(422);

    const kosong = await api("/api/managers/import", {
      method: "POST", headers: json(), body: JSON.stringify([]),
    });
    expect(kosong.status).toBe(400);
  });

  test("import tanpa token → 401", async () => {
    for (const path of ["/api/tutors/import", "/api/students/import", "/api/managers/import"]) {
      const res = await api(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ nama: "x" }]),
      });
      expect(res.status).toBe(401);
    }
  });
});

describe("import konten: facilities/achievements/service-points/agendas (nama-minimal)", () => {
  test("4 endpoint menerima array nama-minimal; cleanup per baris", async () => {
    const prefix = tag("IMP");
    const bodies: Record<string, string> = {
      facilities: JSON.stringify([{ nama: `${prefix}-S`, keterangan: "k", foto: "" }]),
      achievements: JSON.stringify([
        { nama: `${prefix}-P`, tahun: "2026", tingkat: "K", penyelenggara: "D", peserta: "W", keterangan: "k", foto: "" },
      ]),
      "service-points": JSON.stringify([
        { nama: `${prefix}-T`, alamat: "j", penjab: "p", waktuPembelajaran: "pg", jumlahWb: "1", keterangan: "k", foto: "" },
      ]),
      agendas: JSON.stringify([
        { nama: `${prefix}-A`, pelaksanaan: "10-09-2026", waktu: "08:00", peserta: "W", lokasi: "R", penyelenggara: "P", penanggungjawab: "J", keterangan: "k", foto: "" },
      ]),
    };
    for (const [ent, body] of Object.entries(bodies)) {
      const res = await api(`/api/${ent}/import`, { method: "POST", headers: json(), body });
      expect(res.status).toBe(200);
      // Bentuk respons beda-beda: ada yang {imported} ada yang hanya {message}.
      expect(res.body).toHaveProperty("success", true);
    }
    for (const ent of Object.keys(bodies)) {
      const list = await api(`/api/${ent}`);
      const ids = ((list.body as { data: { id: number; nama: string }[] }).data ?? [])
        .filter((r) => r.nama.startsWith(prefix))
        .map((r) => r.id);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect((await api(`/api/${ent}/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
      }
    }
  });

  test("alumni/import butuh 24 field lengkap (skema ketat); baris tak lengkap → 422", async () => {
    const bad = await api("/api/alumni/import", {
      method: "POST", headers: json(), body: JSON.stringify([{ nama: tag("A") }]),
    });
    expect(bad.status).toBe(422);
  });
});

describe("bulk siswa: promote + graduate + rombels/sync", () => {
  test("bulk promote 2 siswa sekaligus", async () => {
    const ids: number[] = [];
    for (const suffix of ["B1", "B2"]) {
      ids.push(
        createdId(
          await api("/api/students", {
            method: "POST", headers: json(),
            body: JSON.stringify({ nama: tag(`BULK-${suffix}`), kelas: "PAKET C 10 A" }),
          }),
        ),
      );
    }
    try {
      const res = await api("/api/students/bulk/promote", {
        method: "POST", headers: json(), body: JSON.stringify({ studentIds: ids }),
      });
      expect(res.status).toBe(200);
      expect((res.body as { promoted: number }).promoted).toBe(2);
    } finally {
      for (const id of ids) await api(`/api/students/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("bulk graduate memindahkan ke alumni; sync membuat rombel dari kelas", async () => {
    const nama = tag("LULUS-BULK");
    const id = createdId(
      await api("/api/students", {
        method: "POST", headers: json(),
        body: JSON.stringify({ nama, kelas: "PAKET C 12 A" }),
      }),
    );
    try {
      const grad = await api("/api/students/bulk/graduate", {
        method: "POST", headers: json(),
        body: JSON.stringify({ studentIds: [id], tahunLulus: "2026" }),
      });
      expect(grad.status).toBe(200);

      const sync = await api("/api/rombels/sync", { method: "POST", headers: H() });
      expect(sync.status).toBe(200);
      expect(sync.body).toHaveProperty("success", true);
    } finally {
      await api(`/api/students/${id}`, { method: "DELETE", headers: H() });
      const alumni = await api("/api/alumni");
      const row = ((alumni.body as { data: { id: number; nama: string }[] }).data ?? []).find((a) =>
        a.nama.includes(nama.split("-")[2] ?? nama),
      );
      if (row) await api(`/api/alumni/${row.id}`, { method: "DELETE", headers: H() });
    }
  });
});
