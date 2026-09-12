import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "content-db-failure-secret";

const boom = (): never => {
  throw new Error("fake content db failure");
};

const db = {
  select: () => ({
    from: () => ({
      where: () => ({ get: boom, all: boom }),
      get: boom,
      all: boom,
    }),
  }),
  insert: () => ({ values: () => ({ returning: () => ({ get: boom }), run: boom }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => ({ get: boom }), run: boom }) }) }),
  delete: () => ({ where: () => ({ run: boom }) }),
  transaction: boom,
};

mock.module("../../../src/server/config/db.ts", () => ({ db }));
mock.module("../../../src/server/services/storage.ts", () => ({
  cleanupReplacedFiles: boom,
  cleanupRowFiles: boom,
}));

const { contentHandlers } = await import("../../../src/server/handlers/content");

async function signedToken() {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const helper = new Elysia()
    .use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
    .get("/", ({ jwt: j }: any) =>
      j.sign({ id: 1, username: "admin@test.local", role: "super_admin", name: "Admin", email: "admin@test.local" }),
    );
  return (await helper.handle(new Request("http://token.test/"))).text();
}

let token: string;
async function call(path: string, method = "GET", body?: unknown) {
  token ??= await signedToken();
  const headers = new Headers({ authorization: `Bearer ${token}` });
  let payload: string | undefined;
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body);
  }
  const original = console.error;
  console.error = mock(() => {});
  try {
    return await contentHandlers.fetch(new Request(`http://content.test${path}`, { method, headers, body: payload }));
  } finally {
    console.error = original;
  }
}

const slider = { title: "Slider", image: "/api/files/a.png", status: "AKTIF" };
const announcement = { text: "Announcement", date: "2026-09-12", status: "AKTIF" };
const profile = {
  namaLembaga: "PKBM", npsn: "", nomorIndukLembaga: "", statusAkreditasi: "", tahunBerdiri: "",
  nomorTelepon: "", email: "", alamatLengkap: "", noIzinPendirian: "", izinYayasan: "",
  izinOperasional: "", npwp: "", rekeningNomor: "", rekeningAtasNama: "", rekeningNamaBank: "",
  foto: "", gambar: "",
};
const education = { program: "Program", penjab: "PJ", keterangan: "", foto: "" };
const facility = { nama: "Sarana", keterangan: "", foto: "" };

const achievement = {
  nama: "Prestasi", tahun: "2026", tingkat: "Kota", penyelenggara: "", peserta: "", keterangan: "", foto: "",
};
const servicePoint = {
  nama: "Titik", alamat: "Jalan", penjab: "PJ", waktuPembelajaran: "", jumlahWb: "", keterangan: "", foto: "",
};
const agenda = { nama: "Agenda", pelaksanaan: "2026-09-12", waktu: "08:00" };
const download = {
  namaFile: "Download", kategori: "Modul", fileUrl: "/api/files/a.pdf", status: "PUBLISH", tanggalUpload: "2026",
};
const product = {
  namaProduk: "Produk", deskripsi: "d", noHp: "0", penjual: "p", satuan: "pcs", harga: 1,
  status: "AKTIF", gambar: "",
};
const gallery = {
  namaFile: "Galeri", kategori: "Kegiatan", tanggalPosting: "2026-09-12", foto: "[]", status: "PUBLISH",
};
const alumni = {
  nama: "Alumni", nik: "1", program: "C", tahunLulus: "2026", nisn: "", nis: "", tempatTglLahir: "",
  noHp: "", namaAyah: "", namaIbu: "", jenisKelamin: "L", agama: "", email: "", alamat: "", rt: "",
  rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "", pekerjaan: "",
  cerita: "", foto: "",
};

async function expect500(path: string, method = "GET", body?: unknown) {
  const response = await call(path, method, body);
  expect(response.status).toBe(500);
}

describe("content DB failure paths", () => {
  test("sliders and announcements return 500 for every DB operation", async () => {
    await expect500("/api/sliders");
    await expect500("/api/sliders", "POST", slider);
    await expect500("/api/sliders/1", "PUT", slider);
    await expect500("/api/sliders/1", "DELETE");
    await expect500("/api/announcements");
    await expect500("/api/announcements", "POST", announcement);
    await expect500("/api/announcements/1", "PUT", announcement);
    await expect500("/api/announcements/1", "DELETE");
  });

  test("singletons return 500 for reads and writes", async () => {
    await expect500("/api/institution-profile");
    await expect500("/api/institution-profile", "POST", profile);
    await expect500("/api/vision-mission");
    await expect500("/api/vision-mission", "POST", { visi: "v", misi: "m" });
  });

  test("education programs return 500 for CRUD", async () => {
    await expect500("/api/education-programs");
    await expect500("/api/education-programs", "POST", education);
    await expect500("/api/education-programs/1", "PUT", education);
    await expect500("/api/education-programs/1", "DELETE");
  });

  test("facilities return 500 for CRUD and import", async () => {
    await expect500("/api/facilities");
    await expect500("/api/facilities", "POST", facility);
    await expect500("/api/facilities/1", "PUT", facility);
    await expect500("/api/facilities/1", "DELETE");
    await expect500("/api/facilities/import", "POST", [facility]);
  });

  test("achievements return 500 for CRUD and import", async () => {
    await expect500("/api/achievements");
    await expect500("/api/achievements", "POST", achievement);
    await expect500("/api/achievements/1", "PUT", achievement);
    await expect500("/api/achievements/1", "DELETE");
    await expect500("/api/achievements/import", "POST", [achievement]);
  });

  test("service points return 500 for CRUD and import", async () => {
    await expect500("/api/service-points");
    await expect500("/api/service-points", "POST", servicePoint);
    await expect500("/api/service-points/1", "PUT", servicePoint);
    await expect500("/api/service-points/1", "DELETE");
    await expect500("/api/service-points/import", "POST", [servicePoint]);
  });

  test("agendas return 500 for CRUD and import", async () => {
    await expect500("/api/agendas");
    await expect500("/api/agendas", "POST", agenda);
    await expect500("/api/agendas/1", "PUT", agenda);
    await expect500("/api/agendas/1", "DELETE");
    await expect500("/api/agendas/import", "POST", [agenda]);
  });

  test("downloads return 500 for all queries and mutations", async () => {
    await expect500("/api/downloads");
    await expect500("/api/downloads/admin");
    await expect500("/api/downloads", "POST", download);
    await expect500("/api/downloads/1", "PUT", download);
    await expect500("/api/downloads/1/hit", "POST");
    await expect500("/api/downloads/1", "DELETE");
  });

  test("products return 500 for all queries and mutations", async () => {
    await expect500("/api/products");
    await expect500("/api/products/admin");
    await expect500("/api/products", "POST", product);
    await expect500("/api/products/1", "PUT", product);
    await expect500("/api/products/1", "DELETE");
  });

  test("alumni return 500 for all operations", async () => {
    await expect500("/api/alumni");
    await expect500("/api/alumni/admin");
    await expect500("/api/alumni", "POST", alumni);
    await expect500("/api/alumni/import", "POST", [alumni]);
    await expect500("/api/alumni/1", "PUT", alumni);
    await expect500("/api/alumni/1", "DELETE");
  });

  test("gallery returns 500 for all operations", async () => {
    await expect500("/api/gallery");
    await expect500("/api/gallery/admin");
    await expect500("/api/gallery", "POST", gallery);
    await expect500("/api/gallery/1", "PUT", gallery);
    await expect500("/api/gallery/1", "DELETE");
  });
});
