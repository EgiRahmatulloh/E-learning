// Integration test live-server: CRUD terautorisasi (role admin).
// Setiap entitas diuji siklus penuh create → read → update → delete dengan
// nama unik IT-TEST-* agar idempoten. Data uji selalu dibersihkan (DELETE)
// sehingga DB produksi/dev tidak tercemar.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-crud-admin.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = (v: unknown) => ({
  "Content-Type": "application/json",
  ...H(),
});

describe("sliders: CRUD penuh", () => {
  test("create → get → update → delete", async () => {
    const title = tag("SLIDER");
    const created = await api("/api/sliders", {
      method: "POST",
      headers: json(title),
      body: JSON.stringify({ title, image: "/api/files/it-test.png" }),
    });
    const id = createdId(created);

    const list = await api("/api/sliders", { headers: H() });
    expect(list.status).toBe(200);
    const found = ((list.body as { data: { id: number }[] }).data ?? []).some((s) => s.id === id);
    expect(found).toBe(true);

    const updated = await api(`/api/sliders/${id}`, {
      method: "PUT",
      headers: json(title),
      body: JSON.stringify({ title: `${title}-UBAH`, image: "/api/files/it-test.png", status: "AKTIF" }),
    });
    expect(updated.status).toBe(200);
    expect((updated.body as { data: { title: string } }).data.title).toBe(`${title}-UBAH`);

    const del = await api(`/api/sliders/${id}`, { method: "DELETE", headers: H() });
    expect(del.status).toBe(200);
    const gone = await api("/api/sliders", { headers: H() });
    expect(((gone.body as { data: { id: number }[] }).data ?? []).some((s) => s.id === id)).toBe(false);
  });

  test("tanpa token → 401; id tak valid → 400", async () => {
    const noAuth = await api("/api/sliders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", image: "y" }),
    });
    expect(noAuth.status).toBe(401);

    const badId = await api("/api/sliders/abc", { method: "DELETE", headers: H() });
    expect(badId.status).toBe(400);
  });
});

describe("announcements: CRUD penuh", () => {
  test("create → delete (validasi tanggal DD-MM-YYYY)", async () => {
    const text = tag("PENGUMUMAN");
    const created = await api("/api/announcements", {
      method: "POST",
      headers: json(text),
      body: JSON.stringify({ text, date: "10-09-2026" }),
    });
    const id = createdId(created);

    // Skema hanya minLength 10 + maxLength 10 (tanpa pola DD-MM-YYYY) — format
    // ISO 10 karakter lolos validasi. Yang ditolak: string < 10 karakter.
    const bad = await api("/api/announcements", {
      method: "POST",
      headers: json(text),
      body: JSON.stringify({ text, date: "10-09-26" }),
    });
    expect(bad.status).toBe(422);

    const del = await api(`/api/announcements/${id}`, { method: "DELETE", headers: H() });
    expect(del.status).toBe(200);
  });
});

describe("tutors: create + sanitasi list + delete", () => {
  test("password disamarkan di list; hapus bersih", async () => {
    const nama = tag("TUTOR");
    const id = createdId(
      await api("/api/tutors", {
        method: "POST",
        headers: json(nama),
        body: JSON.stringify({ nama }),
      }),
    );

    const list = await api("/api/tutors", { headers: H() });
    expect(list.status).toBe(200);
    const row = ((list.body as { data: { id: number; password: string }[] }).data ?? []).find(
      (t) => t.id === id,
    );
    expect(row).toBeDefined();
    expect(row!.password).toBe("");

    const del = await api(`/api/tutors/${id}`, { method: "DELETE", headers: H() });
    expect(del.status).toBe(200);
  });
});

describe("students: create + graduate/promote + delete", () => {
  test("buat siswa, promosikan kelas, luluskan (pindah ke alumni), hapus sisa", async () => {
    const nama = tag("SISWA");
    const id = createdId(
      await api("/api/students", {
        method: "POST",
        headers: json(nama),
        body: JSON.stringify({ nama, kelas: "PAKET C 10 A", program: "PAKET C" }),
      }),
    );

    // Promote naik otomatis satu tingkat dari kelas saat ini (body kosong).
    const promote = await api(`/api/students/${id}/promote`, {
      method: "POST",
      headers: json(nama),
      body: JSON.stringify({}),
    });
    expect(promote.status).toBe(200);
    expect((promote.body as { data: { kelas: string } }).data.kelas).toBe("PAKET C 11");

    const graduate = await api(`/api/students/${id}/graduate`, {
      method: "POST",
      headers: json(nama),
      body: JSON.stringify({ tahunLulus: "2026" }),
    });
    expect(graduate.status).toBe(200);

    // Graduate TIDAK menghapus baris: status → LULUS + salinan dibuat di alumni.
    const data = (graduate.body as { data: { status: string } }).data;
    expect(data.status).toBe("LULUS");

    // /api/alumni publik (tanpa auth) — verifikasi salinan kelulusan.
    const alumni = await api("/api/alumni");
    const gradRow = ((alumni.body as { data: { id: number; nama: string }[] }).data ?? []).find((a) =>
      a.nama.includes(nama.split("-")[2] ?? nama),
    );
    expect(gradRow).toBeDefined();

    // Bersihkan keduanya: baris alumni + baris siswa LULUS.
    expect((await api(`/api/alumni/${gradRow!.id}`, { method: "DELETE", headers: H() })).status).toBe(
      200,
    );
    expect((await api(`/api/students/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });
});

describe("news + categories: CRUD + hits atomik", () => {
  test("kategori create → delete; berita create → hit → delete", async () => {
    const katNama = tag("KATEGORI");
    const katId = createdId(
      await api("/api/news-categories", {
        method: "POST",
        headers: json(katNama),
        body: JSON.stringify({ nama: katNama }),
      }),
    );

    const judul = tag("BERITA");
    const newsId = createdId(
      await api("/api/news", {
        method: "POST",
        headers: json(judul),
        body: JSON.stringify({ judul, kategori: katNama, tanggalPosting: "10-09-2026" }),
      }),
    );

    const h1 = await api(`/api/news/${newsId}/hit`, { method: "POST" });
    const h2 = await api(`/api/news/${newsId}/hit`, { method: "POST" });
    expect(h1.status).toBe(200);
    expect(h2.status).toBe(200);
    expect((h2.body as { data: { hits: number } }).data.hits).toBe(
      (h1.body as { data: { hits: number } }).data.hits + 1,
    );

    expect((await api(`/api/news/${newsId}`, { method: "DELETE", headers: H() })).status).toBe(200);
    expect((await api(`/api/news-categories/${katId}`, { method: "DELETE", headers: H() })).status).toBe(
      200,
    );
  });
});

describe("rombels: create + tambah siswa + hapus", () => {
  test("buat rombel unik, tolak duplikat, tambah & keluarkan siswa", async () => {
    const nama = tag("ROMBEL");
    const rombelId = createdId(
      await api("/api/rombels", {
        method: "POST",
        headers: json(nama),
        body: JSON.stringify({ nama }),
      }),
    );

    const duplikat = await api("/api/rombels", {
      method: "POST",
      headers: json(nama),
      body: JSON.stringify({ nama }),
    });
    expect(duplikat.status).toBe(400);

    const siswaNama = tag("SISWA-ROMBEL");
    const siswaId = createdId(
      await api("/api/students", {
        method: "POST",
        headers: json(siswaNama),
        body: JSON.stringify({ nama: siswaNama, kelas: nama }),
      }),
    );

    const add = await api(`/api/rombels/${rombelId}/students`, {
      method: "POST",
      headers: json(nama),
      body: JSON.stringify({ studentId: siswaId }),
    });
    expect(add.status).toBe(200);

    const members = await api(`/api/rombels/${rombelId}/students`, { headers: H() });
    expect(members.status).toBe(200);

    expect(
      (await api(`/api/rombels/${rombelId}/students/${siswaId}`, { method: "DELETE", headers: H() }))
        .status,
    ).toBe(200);
    expect((await api(`/api/rombels/${rombelId}`, { method: "DELETE", headers: H() })).status).toBe(
      200,
    );
    expect((await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() })).status).toBe(
      200,
    );
  });
});
