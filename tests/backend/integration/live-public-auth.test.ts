// Integration test live-server: endpoint publik + auth.
// Prasyarat: server jalan (BASE_URL, default http://localhost:3000).
// Prasyarat: server test jalan (BASE_URL). Jalankan: bun run test:be:integration
import { describe, expect, test } from "bun:test";
import { api, authHeader, loginAdmin } from "./live-helpers";

// Menguji kontrak endpoint backend melalui HTTP tanpa browser.

describe("endpoint publik (tanpa token)", () => {
  test("hello + public-stats 200 dengan bentuk respons benar", async () => {
    const hello = await api("/api/hello");
    expect(hello.status).toBe(200);
    expect(hello.body).toMatchObject({ message: expect.any(String), status: "Connected" });

    const stats = await api("/api/public-stats");
    expect(stats.status).toBe(200);
    // Catatan: JANGAN pakai toMatchObject dengan asymmetric matcher di sini —
    // Bun 1.4.2 punya bug: toMatchObject me-MUTATE objek yang dicek sehingga
    // `data` menjadi {} setelahnya (semua key hilang). Akses dulu, asersi sesudahnya.
    const data = (stats.body as { data: Record<string, number> }).data;
    for (const key of ["students", "alumni", "tutors", "rombel", "managers", "servicePoints"]) {
      expect(typeof data[key], `key ${key}`).toBe("number");
    }
    expect(stats.body).toMatchObject({ success: true });
  });

  test("konten landing 200: sliders, announcements, profile, visi-misi, dst.", async () => {
    for (const path of [
      "/api/sliders",
      "/api/announcements",
      "/api/institution-profile",
      "/api/vision-mission",
      "/api/education-programs",
      "/api/facilities",
      "/api/achievements",
      "/api/service-points",
      "/api/agendas",
      "/api/news",
      "/api/news-categories",
      "/api/downloads",
      "/api/products",
      "/api/gallery",
      "/api/alumni",
    ]) {
      const res = await api(path);
      expect(res.status).toBe(200);
      // Vision-mission boleh null (belum diisi admin); sisanya wajib ada.
      // toMatchObject dipanggil TERAKHIR karena bug mutasi Bun (lihat atas).
      if (path !== "/api/vision-mission") {
        expect((res.body as { data: unknown }).data).not.toBeNull();
      }
      expect(res.body).toMatchObject({ success: true });
    }
  });

  test("public-students memakai whitelist (tanpa email/nik/nisn/nama ortu)", async () => {
    const res = await api("/api/public-students");
    expect(res.status).toBe(200);
    const rows = (res.body as { data: Record<string, unknown>[] }).data;
    expect(Array.isArray(rows)).toBe(true);
    for (const row of rows.slice(0, 20)) {
      for (const leaked of ["email", "nik", "nisn", "nis", "namaAyah", "namaIbu", "noHp", "password"]) {
        expect(leaked in row).toBe(false);
      }
      expect(row).toHaveProperty("nama");
    }
  });

  test("public-tutors: tanpa nik/email/password/rt-desa (alamat jalan boleh)", async () => {
    // Komentar handler: whitelist profil pendidik — alamat (baris jalan) boleh
    // tampil, tapi nik/email/sub-alamat/password tidak.
    const res = await api("/api/public-tutors");
    expect(res.status).toBe(200);
    const rows = (res.body as { data: Record<string, unknown>[] }).data;
    expect(Array.isArray(rows)).toBe(true);
    for (const row of rows.slice(0, 20)) {
      for (const leaked of ["nik", "email", "password", "rt", "rw", "desa", "kecamatan", "kabupaten", "provinsi"]) {
        expect(leaked in row).toBe(false);
      }
      expect(row).toHaveProperty("nama");
    }
  });

  test("penghitung hits publik bertambah (news & downloads)", async () => {
    const news = await api("/api/news");
    const first = (news.body as { data: { id: number; hits: number }[] }).data[0];
    expect(first?.id).toBeNumber();
    const before = first.hits ?? 0;
    const hit = await api(`/api/news/${first.id}/hit`, { method: "POST" });
    expect(hit.status).toBe(200);
    expect((hit.body as { data: { hits: number } }).data.hits).toBe(before + 1);

    const dl = await api("/api/downloads");
    const dlFirst = (dl.body as { data: { id: number; hits: number }[] }).data[0];
    if (dlFirst) {
      const hitDl = await api(`/api/downloads/${dlFirst.id}/hit`, { method: "POST" });
      expect(hitDl.status).toBe(200);
    }
  });

  test("id tidak valid untuk hit → 400, id hilang → 404", async () => {
    expect((await api("/api/news/abc/hit", { method: "POST" })).status).toBe(400);
    expect((await api("/api/news/999999999/hit", { method: "POST" })).status).toBe(404);
  });
});

describe("auth: login & sesi", () => {
  test("login admin seed berhasil + /api/auth/me konsisten", async () => {
    const token = await loginAdmin();
    const me = await api("/api/auth/me", { headers: authHeader(token) });
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      success: true,
      user: expect.objectContaining({ email: "admin@pkbmmakmur.org" }),
    });
  });

  test("password salah → 401, user tak dikenal → 401", async () => {
    const salah = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin@pkbmmakmur.org", password: "salah-xyz" }),
    });
    expect(salah.status).toBe(401);

    const asing = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "tak-ada@x.id", password: "x" }),
    });
    expect(asing.status).toBe(401);
  });

  test("body login tak lengkap → 422 validasi Elysia", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  test("endpoint terproteksi tanpa token → 401", async () => {
    for (const path of [
      "/api/dashboard-stats",
      "/api/rombels",
      "/api/tutors",
      "/api/students",
      "/api/managers",
      "/api/elearning/setups",
    ]) {
      const res = await api(path);
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ success: false });
    }
  });

  test("token basi → 401 dengan pesan sesi", async () => {
    const res = await api("/api/auth/me", { headers: authHeader("token-basi") });
    expect(res.status).toBe(401);
  });

  test("dashboard-stats dengan token admin 200 + paket A/B/C konsisten", async () => {
    const token = await loginAdmin();
    const res = await api("/api/dashboard-stats", { headers: authHeader(token) });
    expect(res.status).toBe(200);
    const data = (res.body as { data: Record<string, number> }).data;
    expect(data.paketA + data.paketB + data.paketC).toBeLessThanOrEqual(data.students);
  });
});
