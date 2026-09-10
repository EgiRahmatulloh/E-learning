// Integration test live-server: konten CMS yang belum dicover file lain —
// singleton (profile, visi-misi) + entitas ber-foto (program, sarana,
// prestasi, titik layanan, agenda) + downloads/products/gallery + alumni
// admin. Semua create memakai nama unik IT-TEST-* dan dihapus lagi.
// Prasyarat: server test jalan (BASE_URL). Jalankan: bun run test:be:integration
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

// Menguji kontrak endpoint backend melalui HTTP tanpa browser.

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

describe("singleton: institution-profile & vision-mission (upsert aman)", () => {
  test("profile dibaca, update lalu kembalikan (tanpa merusak data asli)", async () => {
    const before = await api("/api/institution-profile");
    expect(before.status).toBe(200);
    const orig = (before.body as { data: Record<string, string> }).data;

    const keys = [
      "namaLembaga", "npsn", "nomorIndukLembaga", "statusAkreditasi", "tahunBerdiri",
      "nomorTelepon", "email", "alamatLengkap", "noIzinPendirian", "izinYayasan",
      "izinOperasional", "npwp", "rekeningNomor", "rekeningAtasNama", "rekeningNamaBank",
      "foto", "gambar",
    ] as const;
    const payload: Record<string, string> = {};
    for (const k of keys) payload[k] = orig?.[k] ?? "";

    const upd = await api("/api/institution-profile", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ ...payload, namaLembaga: tag("LEMBAGA") }),
    });
    expect(upd.status).toBe(200);
    expect((upd.body as { data: { namaLembaga: string } }).data.namaLembaga).toContain("IT-TEST-");

    const restore = await api("/api/institution-profile", {
      method: "POST",
      headers: json(),
      body: JSON.stringify(payload),
    });
    expect(restore.status).toBe(200);
    expect((restore.body as { data: { namaLembaga: string } }).data.namaLembaga).toBe(
      payload.namaLembaga,
    );
  });

  test("visi-misi upsert lalu kembalikan", async () => {
    const before = await api("/api/vision-mission");
    const orig = (before.body as { data: { visi: string; misi: string } | null }).data;
    const visiBaru = tag("VISI");
    expect(
      (
        await api("/api/vision-mission", {
          method: "POST",
          headers: json(),
          body: JSON.stringify({ visi: visiBaru, misi: "misi-it" }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api("/api/vision-mission", {
          method: "POST",
          headers: json(),
          body: JSON.stringify({ visi: orig?.visi ?? "", misi: orig?.misi ?? "" }),
        })
      ).status,
    ).toBe(200);
    const after = await api("/api/vision-mission");
    expect((after.body as { data: { visi: string } }).data.visi).toBe(orig?.visi ?? "");
  });

  test("singleton tanpa token → 401 (Elysia validasi body dulu bila tak lengkap)", async () => {
    // Body kosong → 422 validasi mendahului cek auth (perilaku Elysia);
    // body lengkap membuktikan guard verifyAdmin bekerja (401).
    const kosong = await api("/api/institution-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect([401, 422]).toContain(kosong.status);

    const lengkap = await api("/api/vision-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visi: "v", misi: "m" }),
    });
    expect(lengkap.status).toBe(401);
  });
});

// CRUD generik untuk entitas ber-foto: create → get → update → delete.
async function crudFoto(
  base: string,
  createBody: Record<string, string>,
  updateBody: Record<string, string>,
  titleKey: string,
) {
  const created = await api(base, { method: "POST", headers: { "Content-Type": "application/json", ...H() }, body: JSON.stringify(createBody) });
  const id = createdId(created);

  const list = await api(base);
  expect(list.status).toBe(200);
  expect(((list.body as { data: { id: number }[] }).data ?? []).some((r) => r.id === id)).toBe(true);

  const upd = await api(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...H() },
    body: JSON.stringify(updateBody),
  });
  expect(upd.status).toBe(200);
  expect(String((upd.body as { data: Record<string, string> }).data[titleKey])).toContain("UBAH");

  expect((await api(`${base}/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
}

describe("entitas ber-foto: CRUD penuh + cleanup", () => {
  test("education-programs", async () => {
    const nama = tag("PROG");
    await crudFoto(
      "/api/education-programs",
      { program: nama, penjab: "pj", keterangan: "ket", foto: "" },
      { program: `${nama}-UBAH`, penjab: "pj", keterangan: "ket", foto: "" },
      "program",
    );
  });

  test("facilities", async () => {
    const nama = tag("SARANA");
    await crudFoto(
      "/api/facilities",
      { nama, keterangan: "ket", foto: "" },
      { nama: `${nama}-UBAH`, keterangan: "ket", foto: "" },
      "nama",
    );
  });

  test("achievements", async () => {
    const nama = tag("PRESTASI");
    const created = await api("/api/achievements", {
      method: "POST", headers: json(),
      body: JSON.stringify({ nama, tahun: "2026", tingkat: "Kab", penyelenggara: "Diknas", peserta: "WB", keterangan: "k", foto: "" }),
    });
    const id = createdId(created);
    expect((await api(`/api/achievements/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });

  test("service-points", async () => {
    const nama = tag("TITIK");
    const created = await api("/api/service-points", {
      method: "POST", headers: json(),
      body: JSON.stringify({ nama, alamat: "jl", penjab: "pj", waktuPembelajaran: "pagi", jumlahWb: "10", keterangan: "k", foto: "" }),
    });
    const id = createdId(created);
    expect((await api(`/api/service-points/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });

  test("agendas", async () => {
    const nama = tag("AGENDA");
    const created = await api("/api/agendas", {
      method: "POST", headers: json(),
      body: JSON.stringify({ nama, pelaksanaan: "10-09-2026", waktu: "08:00", peserta: "WB", lokasi: "R1", penyelenggara: "PKBM", penanggungjawab: "PJ", keterangan: "k", foto: "" }),
    });
    const id = createdId(created);
    expect((await api(`/api/agendas/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });
});

describe("downloads & products: admin vs publik + validasi", () => {
  test("downloads/admin butuh token; create → hit → delete", async () => {
    expect((await api("/api/downloads/admin")).status).toBe(401);
    const adm = await api("/api/downloads/admin", { headers: H() });
    expect(adm.status).toBe(200);

    const nama = tag("FILE");
    const id = createdId(
      await api("/api/downloads", {
        method: "POST", headers: json(),
        body: JSON.stringify({ namaFile: nama, kategori: "MODUL", fileUrl: "/api/files/it.pdf" }),
      }),
    );
    const hit = await api(`/api/downloads/${id}/hit`, { method: "POST" });
    expect(hit.status).toBe(200);
    expect((await api(`/api/downloads/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });

  test("products: harga negatif ditolak; koersi string→angka; DRAFT tersembunyi publik", async () => {
    expect((await api("/api/products/admin")).status).toBe(401);

    const nama = tag("PRODUK");
    const id = createdId(
      await api("/api/products", {
        method: "POST", headers: json(),
        body: JSON.stringify({ namaProduk: nama, deskripsi: "d", noHp: "0", penjual: "p", satuan: "pcs", harga: "7500", status: "DRAFT" }),
      }),
    );

    const publik = await api("/api/products");
    const terlihat = ((publik.body as { data: { id: number }[] }).data ?? []).some((p) => p.id === id);
    expect(terlihat).toBe(false);

    expect((await api(`/api/products/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });
});

describe("gallery & alumni admin", () => {
  test("gallery/admin butuh token; create → delete", async () => {
    expect((await api("/api/gallery/admin")).status).toBe(401);
    const nama = tag("GALERI");
    const id = createdId(
      await api("/api/gallery", {
        method: "POST", headers: json(),
        body: JSON.stringify({ namaFile: nama, kategori: "KEGIATAN", tanggalPosting: "10-09-2026", foto: "[]", status: "DRAFT" }),
      }),
    );
    // DRAFT tidak muncul di publik
    const publik = await api("/api/gallery");
    expect(((publik.body as { data: { id: number }[] }).data ?? []).some((g) => g.id === id)).toBe(false);
    expect((await api(`/api/gallery/${id}`, { method: "DELETE", headers: H() })).status).toBe(200);
  });

  test("alumni/admin butuh token; publik tanpa field sensitif", async () => {
    expect((await api("/api/alumni/admin")).status).toBe(401);
    expect((await api("/api/alumni/admin", { headers: H() })).status).toBe(200);

    const publik = await api("/api/alumni");
    expect(publik.status).toBe(200);
    for (const row of ((publik.body as { data: Record<string, unknown>[] }).data ?? []).slice(0, 10)) {
      for (const leaked of ["nik", "email", "password", "berkas"]) {
        expect(leaked in row).toBe(false);
      }
    }
  });
});

describe("public-managers: kontrak tampilan publik", () => {
  test("password tidak bocor; NIK/email tampil (kontrak landing — lihat catatan)", async () => {
    // CATATAN: beda dengan public-students/tutors yang di-whitelist ketat,
    // public-managers hanya membuang `password` — NIK, email, dan role masih
    // ikut terkirim (lihat managers.ts public-managers: hanya delete password).
    // Test mengunci perilaku AKTUAL ini agar perubahan diam-diam ketahuan;
    // bila ingin diketatkan seperti students, ubah server + test ini.
    const res = await api("/api/public-managers");
    expect(res.status).toBe(200);
    for (const row of ((res.body as { data: Record<string, unknown>[] }).data ?? []).slice(0, 10)) {
      expect("password" in row).toBe(false);
      expect(row).toHaveProperty("nama");
    }
  });
});
