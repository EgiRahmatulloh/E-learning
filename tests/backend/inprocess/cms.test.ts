import { beforeAll, describe, expect, test } from "bun:test";
import { api, login } from "../helpers/in-process-app";
import { createManager } from "../helpers/db-fixtures";

let token: string;

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "cms-admin", nama: "CMS Admin" });
  token = await login(admin.email, "cms-admin");
});

describe("CMS", () => {
  test("slider dan announcement mengikuti filter publik", async () => {
    const active = await api<any>("/api/sliders", {
      method: "POST",
      token,
      json: { title: "Aktif", image: "/api/files/a.png", status: "AKTIF" },
    });
    const inactive = await api<any>("/api/sliders", {
      method: "POST",
      token,
      json: { title: "Nonaktif", image: "/api/files/b.png", status: "NON AKTIF" },
    });
    expect(active.response.status).toBe(200);
    expect(inactive.response.status).toBe(200);

    const publicList = await api<any>("/api/sliders");
    expect(publicList.data.data.some((item: any) => item.id === active.data.data.id)).toBe(true);
    expect(publicList.data.data.some((item: any) => item.id === inactive.data.data.id)).toBe(false);

    const adminList = await api<any>("/api/sliders", { token });
    expect(adminList.data.data.some((item: any) => item.id === inactive.data.data.id)).toBe(true);

    const announcement = await api<any>("/api/announcements", {
      method: "POST",
      token,
      json: { text: "Pengumuman", date: "2026-09-11", status: "AKTIF" },
    });
    expect(announcement.response.status).toBe(200);
    expect((await api<any>("/api/announcements")).data.data.length).toBeGreaterThan(0);
  });

  test("singleton profile dapat dibuat lalu diperbarui", async () => {
    const empty = await api<any>("/api/institution-profile");
    expect(empty.response.status).toBe(200);

    const profileBody = {
      namaLembaga: "PKBM Test",
      npsn: "",
      nomorIndukLembaga: "",
      statusAkreditasi: "",
      tahunBerdiri: "",
      nomorTelepon: "",
      email: "",
      alamatLengkap: "",
      noIzinPendirian: "",
      izinYayasan: "",
      izinOperasional: "",
      npwp: "",
      rekeningNomor: "",
      rekeningAtasNama: "",
      rekeningNamaBank: "",
      foto: "",
      gambar: "",
    };
    const created = await api<any>("/api/institution-profile", {
      method: "POST",
      token,
      json: profileBody,
    });
    expect(created.response.status).toBe(200);

    const updated = await api<any>("/api/institution-profile", {
      method: "POST",
      token,
      json: { ...profileBody, namaLembaga: "PKBM Test Update", foto: "/api/files/logo.png" },
    });
    expect(updated.response.status).toBe(200);
  });

  test("download CRUD, filter publish, dan hit counter", async () => {
    const created = await api<any>("/api/downloads", {
      method: "POST",
      token,
      json: {
        namaFile: "Panduan",
        kategori: "Dokumen",
        fileUrl: "/api/files/pub-guide.pdf",
        status: "PUBLISH",
      },
    });
    expect(created.response.status).toBe(200);
    const id = created.data.data.id;

    const hit = await api<any>(`/api/downloads/${id}/hit`, { method: "POST" });
    expect(hit.response.status).toBe(200);
    expect(hit.data.data.hits).toBe(1);

    const publicList = await api<any>("/api/downloads");
    expect(publicList.data.data.some((item: any) => item.id === id)).toBe(true);
    expect((await api("/api/downloads/admin")).response.status).toBe(401);
    expect((await api("/api/downloads/admin", { token })).response.status).toBe(200);

    expect((await api(`/api/downloads/${id}`, { method: "DELETE", token })).response.status).toBe(200);
    expect((await api("/api/downloads/nope/hit", { method: "POST" })).response.status).toBe(400);
  });

  test("products memvalidasi harga dan hanya mempublikasikan status aktif", async () => {
    const invalid = await api<any>("/api/products", {
      method: "POST",
      token,
      json: { namaProduk: "Invalid", deskripsi: "-", noHp: "0", penjual: "-", satuan: "pcs", harga: -1 },
    });
    expect(invalid.response.status).toBe(422);

    const created = await api<any>("/api/products", {
      method: "POST",
      token,
      json: { namaProduk: "Produk", deskripsi: "Bagus", noHp: "081", penjual: "Siswa", satuan: "pcs", harga: 1000 },
    });
    expect(created.response.status).toBe(200);
    expect((await api<any>("/api/products")).data.data.some((item: any) => item.id === created.data.data.id)).toBe(true);
    expect((await api("/api/products/admin", { token })).response.status).toBe(200);
  });

  test("news category dan berita mendukung CRUD/hit", async () => {
    const category = await api<any>("/api/news-categories", {
      method: "POST",
      token,
      json: { nama: "Kategori Test" },
    });
    expect(category.response.status).toBe(200);

    const news = await api<any>("/api/news", {
      method: "POST",
      token,
      json: {
        judul: "Berita Test",
        kategori: "Kategori Test",
        tanggalPosting: "2026-09-11",
        status: "PUBLISH",
        foto: "[]",
        konten: "Konten",
      },
    });
    expect(news.response.status).toBe(200);
    const hit = await api<any>(`/api/news/${news.data.data.id}/hit`, { method: "POST" });
    expect(hit.response.status).toBe(200);
    expect(hit.data.data.hits).toBe(1);
    expect((await api("/api/news/nope/hit", { method: "POST" })).response.status).toBe(400);
    expect((await api("/api/news/999999/hit", { method: "POST" })).response.status).toBe(404);
    expect((await api("/api/news-categories/nope", { method: "DELETE", token })).response.status).toBe(400);
    expect((await api("/api/news/nope", { method: "PUT", token, json: { judul: "x", kategori: "y", tanggalPosting: "2026-01-01" } })).response.status).toBe(400);
    expect((await api("/api/news/nope", { method: "DELETE", token })).response.status).toBe(400);

    // PUT matrix: 404 hilang, update sukses + cleanup foto, PUT tanpa foto pakai existing
    expect(
      (
        await api("/api/news/999999", {
          method: "PUT",
          token,
          json: { judul: "x", kategori: "y", tanggalPosting: "2026-01-01" },
        })
      ).response.status,
    ).toBe(404);
    const upd = await api<any>(`/api/news/${news.data.data.id}`, {
      method: "PUT",
      token,
      json: {
        judul: "Berita Update",
        kategori: "Kategori Test",
        tanggalPosting: "2026-09-12",
        status: "DRAFT",
        foto: '["/api/files/berita-baru.png"]',
        konten: "Konten Baru",
      },
    });
    expect(upd.response.status).toBe(200);
    expect(upd.data.data.judul).toBe("Berita Update");
    const keep = await api<any>(`/api/news/${news.data.data.id}`, {
      method: "PUT",
      token,
      json: { judul: "Berita Update 2", kategori: "Kategori Test", tanggalPosting: "2026-09-12" },
    });
    expect(keep.response.status).toBe(200);
    expect(keep.data.data.status).toBe("DRAFT");

    expect((await api(`/api/news/${news.data.data.id}`, { method: "DELETE", token })).response.status).toBe(200);
    expect((await api(`/api/news-categories/${category.data.data.id}`, { method: "DELETE", token })).response.status).toBe(200);
  });
});
