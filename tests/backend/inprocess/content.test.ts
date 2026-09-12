import { beforeAll, describe, expect, mock, test } from "bun:test";
import { api, db, login, models, signToken } from "../helpers/in-process-app";
import { createManager, createStudent } from "../helpers/db-fixtures";

let adminToken: string;
let staffToken: string;
let studentToken: string;
let serial = 0;
const unique = (prefix: string) => `${prefix}-${Date.now()}-${serial++}`;

beforeAll(async () => {
  const admin = await createManager({
    nama: "Content Admin",
    role: "admin",
    plainPassword: "content-admin",
  });
  adminToken = await login(admin.email, "content-admin");
  staffToken = await signToken({
    id: 2, username: "root@test.local", role: "super_admin",
    name: "Root Content", email: "root@test.local",
  });
  studentToken = await signToken({
    id: 3, username: "student@test.local", role: "student",
    name: "Student", email: "student@test.local",
  });
});

const request = (path: string, method = "GET", json?: unknown, token = staffToken) =>
  api<any>(path, { method, token, ...(json === undefined ? {} : { json }) });

async function withDbFailure<T>(operation: () => Promise<T>): Promise<T> {
  const originalSelect = db.select;
  const originalInsert = db.insert;
  const originalUpdate = db.update;
  const originalDelete = db.delete;
  const originalTransaction = db.transaction;
  const boom = () => { throw new Error("fake content db failure"); };
  Object.assign(db, {
    select: boom,
    insert: boom,
    update: boom,
    delete: boom,
    transaction: boom,
  });
  const originalError = console.error;
  console.error = mock(() => {});
  try {
    return await operation();
  } finally {
    console.error = originalError;
    Object.assign(db, {
      select: originalSelect,
      insert: originalInsert,
      update: originalUpdate,
      delete: originalDelete,
      transaction: originalTransaction,
    });
  }
}

const slider = (suffix = "") => ({
  title: `Slider${suffix}`, image: `/api/files/slider${suffix}.png`, status: "AKTIF",
});
const announcement = (suffix = "") => ({
  text: `Pengumuman${suffix}`, date: "2026-09-12", status: "AKTIF",
});
const education = (suffix = "") => ({
  program: `Program${suffix}`, penjab: "PJ", keterangan: "Ket", foto: `/api/files/program${suffix}.png`,
});
const facility = (suffix = "") => ({
  nama: `Sarana${suffix}`, keterangan: "Ket", foto: `/api/files/facility${suffix}.png`,
});

const achievement = (suffix = "") => ({
  nama: `Prestasi${suffix}`, tahun: "2026", tingkat: "Kabupaten", penyelenggara: "Dinas",
  peserta: "Siswa", keterangan: "Ket", foto: `/api/files/achievement${suffix}.png`,
});
const servicePoint = (suffix = "") => ({
  nama: `Titik${suffix}`, alamat: "Jalan", penjab: "PJ", waktuPembelajaran: "Pagi",
  jumlahWb: "10", keterangan: "Ket", foto: `/api/files/service${suffix}.png`,
});
const agenda = (suffix = "") => ({
  nama: `Agenda${suffix}`, pelaksanaan: "2026-09-12", waktu: "08:00", peserta: "Siswa",
  lokasi: "Aula", penyelenggara: "PKBM", penanggungjawab: "PJ", keterangan: "Ket",
  foto: `/api/files/agenda${suffix}.png`,
});
const download = (suffix = "") => ({
  namaFile: `Unduhan${suffix}`, kategori: "Modul", fileUrl: `/api/files/download${suffix}.pdf`,
  status: "PUBLISH", tanggalUpload: "12 September 2026",
});
const product = (suffix = "") => ({
  namaProduk: `Produk${suffix}`, deskripsi: "Bagus", noHp: "0812", penjual: "Siswa",
  satuan: "pcs", harga: 1000, status: "AKTIF", gambar: `/api/files/product${suffix}.png`,
});
const galleryBody = (suffix = "") => ({
  namaFile: `Galeri${suffix}`, kategori: "Kegiatan", tanggalPosting: "2026-09-12",
  foto: JSON.stringify([`/api/files/gallery${suffix}.png`]), status: "PUBLISH",
});
const profile = (suffix = "") => ({
  namaLembaga: `PKBM${suffix}`, npsn: "", nomorIndukLembaga: "", statusAkreditasi: "",
  tahunBerdiri: "", nomorTelepon: "", email: "", alamatLengkap: "", noIzinPendirian: "",
  izinYayasan: "", izinOperasional: "", npwp: "", rekeningNomor: "", rekeningAtasNama: "",
  rekeningNamaBank: "", foto: `/api/files/profile${suffix}.png`, gambar: `/api/files/banner${suffix}.png`,
});
const alumniBody = (suffix = "") => ({
  nama: `Alumni${suffix}`, nik: unique("nik"), program: "PAKET C", tahunLulus: "2026",
  nisn: "", nis: "", tempatTglLahir: "Bandung", noHp: "", namaAyah: "", namaIbu: "",
  jenisKelamin: "L", agama: "Islam", email: `${unique("alumni")}@test.local`, alamat: "",
  rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "",
  pekerjaan: "", cerita: "", foto: `/api/files/alumni${suffix}.png`,
});

async function created(path: string, body: unknown) {
  const result = await request(path, "POST", body);
  expect(result.response.status).toBe(200);
  return result.data.data;
}

describe("content DB failure coverage", () => {
  test("all route catch paths return 500 in the in-process app", async () => {
    const cases: Array<[string, string?, unknown?]> = [
      ["/api/sliders"], ["/api/sliders", "POST", slider()], ["/api/sliders/1", "PUT", slider()], ["/api/sliders/1", "DELETE"],
      ["/api/announcements"], ["/api/announcements", "POST", announcement()], ["/api/announcements/1", "PUT", announcement()], ["/api/announcements/1", "DELETE"],
      ["/api/institution-profile"], ["/api/institution-profile", "POST", profile()],
      ["/api/vision-mission"], ["/api/vision-mission", "POST", { visi: "v", misi: "m" }],
      ["/api/education-programs"], ["/api/education-programs", "POST", education()], ["/api/education-programs/1", "PUT", education()], ["/api/education-programs/1", "DELETE"],
      ["/api/facilities"], ["/api/facilities", "POST", facility()], ["/api/facilities/1", "PUT", facility()], ["/api/facilities/1", "DELETE"], ["/api/facilities/import", "POST", [facility()]],
      ["/api/achievements"], ["/api/achievements", "POST", achievement()], ["/api/achievements/1", "PUT", achievement()], ["/api/achievements/1", "DELETE"], ["/api/achievements/import", "POST", [achievement()]],
      ["/api/service-points"], ["/api/service-points", "POST", servicePoint()], ["/api/service-points/1", "PUT", servicePoint()], ["/api/service-points/1", "DELETE"], ["/api/service-points/import", "POST", [servicePoint()]],
      ["/api/agendas"], ["/api/agendas", "POST", agenda()], ["/api/agendas/1", "PUT", agenda()], ["/api/agendas/1", "DELETE"], ["/api/agendas/import", "POST", [agenda()]],
      ["/api/downloads"], ["/api/downloads/admin"], ["/api/downloads", "POST", download()], ["/api/downloads/1", "PUT", download()], ["/api/downloads/1/hit", "POST"], ["/api/downloads/1", "DELETE"],
      ["/api/products"], ["/api/products/admin"], ["/api/products", "POST", product()], ["/api/products/1", "PUT", product()], ["/api/products/1", "DELETE"],
      ["/api/alumni"], ["/api/alumni/admin"], ["/api/alumni", "POST", alumniBody()], ["/api/alumni/import", "POST", [alumniBody()]], ["/api/alumni/1", "PUT", alumniBody()], ["/api/alumni/1", "DELETE"],
      ["/api/gallery"], ["/api/gallery/admin"], ["/api/gallery", "POST", galleryBody()], ["/api/gallery/1", "PUT", galleryBody()], ["/api/gallery/1", "DELETE"],
    ];
    await withDbFailure(async () => {
      for (const [path, method = "GET", body] of cases) {
        expect((await request(path, method, body)).response.status).toBe(500);
      }
    });
  });
});

describe("content authorization and filtering", () => {
  test("public filters inactive content while both admin roles see management data", async () => {
    const hiddenSlider = await created("/api/sliders", { ...slider("-hidden"), status: "NON AKTIF" });
    const hiddenAnnouncement = await created("/api/announcements", {
      ...announcement("-hidden"), status: "TIDAK AKTIF",
    });
    const publicSliders = await api<any>("/api/sliders");
    const publicAnnouncements = await api<any>("/api/announcements");
    expect(publicSliders.data.data.some((x: any) => x.id === hiddenSlider.id)).toBe(false);
    expect(publicAnnouncements.data.data.some((x: any) => x.id === hiddenAnnouncement.id)).toBe(false);
    expect((await api<any>("/api/sliders", { token: adminToken })).data.data.some((x: any) => x.id === hiddenSlider.id)).toBe(true);
    expect((await api<any>("/api/announcements", { token: staffToken })).data.data.some((x: any) => x.id === hiddenAnnouncement.id)).toBe(true);
  });

  test("writes reject missing credentials and non-admin roles", async () => {
    expect((await api("/api/sliders", { method: "POST", json: slider("-anon") })).response.status).toBe(401);
    expect((await api("/api/sliders", { method: "POST", token: studentToken, json: slider("-student") })).response.status).toBe(403);
    expect((await api("/api/downloads/admin")).response.status).toBe(401);
    expect((await api("/api/products/admin", { token: studentToken })).response.status).toBe(403);
    expect((await api("/api/alumni/admin", { token: adminToken })).response.status).toBe(200);
    expect((await api("/api/gallery/admin", { token: staffToken })).response.status).toBe(200);
  });

  test("schemas reject malformed create and update payloads", async () => {
    expect((await request("/api/announcements", "POST", { text: "", date: "bad" })).response.status).toBe(422);
    expect((await request("/api/education-programs", "POST", { ...education(), program: "" })).response.status).toBe(422);
    expect((await request("/api/facilities", "POST", { nama: "" })).response.status).toBe(422);
    expect((await request("/api/achievements", "POST", { ...achievement(), tahun: "" })).response.status).toBe(422);
    expect((await request("/api/service-points", "POST", { ...servicePoint(), alamat: "" })).response.status).toBe(422);
    expect((await request("/api/agendas", "POST", { nama: "", pelaksanaan: "", waktu: "" })).response.status).toBe(422);
    expect((await request("/api/downloads", "POST", { namaFile: "", kategori: "", fileUrl: "" })).response.status).toBe(422);
    expect((await request("/api/products", "POST", { ...product(), harga: -1 })).response.status).toBe(422);
  });
});

describe("simple content CRUD", () => {
  test("slider CRUD, invalid IDs, and missing update", async () => {
    const row = await created("/api/sliders", slider("-create"));
    expect(row.creator).toBe("Root Content");
    const updated = await request(`/api/sliders/${row.id}`, "PUT", slider("-updated"));
    expect(updated.response.status).toBe(200);
    expect(updated.data.data.title).toBe("Slider-updated");
    expect((await request("/api/sliders/nope", "PUT", slider())).response.status).toBe(400);
    expect((await request("/api/sliders/999999", "PUT", slider())).response.status).toBe(404);
    expect((await request("/api/sliders/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/sliders/${row.id}`, "DELETE")).response.status).toBe(200);
  });

  test("announcement CRUD, defaults, invalid IDs, and missing update", async () => {
    const row = await created("/api/announcements", { text: "Default", date: "2026-09-12" });
    expect(row.status).toBe("AKTIF");
    expect(row.creator).toBe("Root Content");
    const updated = await request(`/api/announcements/${row.id}`, "PUT", announcement("-updated"));
    expect(updated.data.data.text).toBe("Pengumuman-updated");
    expect((await request("/api/announcements/nope", "PUT", announcement())).response.status).toBe(400);
    expect((await request("/api/announcements/999999", "PUT", announcement())).response.status).toBe(404);
    expect((await request("/api/announcements/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/announcements/${row.id}`, "DELETE")).response.status).toBe(200);
  });

  test("singleton profile and vision-mission create then update", async () => {
    const firstProfile = await request("/api/institution-profile", "POST", profile("-one"));
    expect(firstProfile.response.status).toBe(200);
    const nextProfile = await request("/api/institution-profile", "POST", profile("-two"));
    expect(nextProfile.data.data.namaLembaga).toBe("PKBM-two");
    expect((await api<any>("/api/institution-profile")).data.data.namaLembaga).toBe("PKBM-two");

    expect((await request("/api/vision-mission", "POST", { visi: "Visi satu", misi: "Misi satu" })).response.status).toBe(200);
    const vm = await request("/api/vision-mission", "POST", { visi: "Visi dua", misi: "Misi dua" });
    expect(vm.data.data.visi).toBe("Visi dua");
    expect((await api<any>("/api/vision-mission")).data.data.misi).toBe("Misi dua");
  });
});

describe("photo entity CRUD and imports", () => {
  test("education program CRUD handles missing rows", async () => {
    const row = await created("/api/education-programs", education("-create"));
    const educationList = await api<any>("/api/education-programs");
    expect(educationList.response.status).toBe(200);
    expect(educationList.data.data.some((x: any) => x.id === row.id)).toBe(true);
    expect((await request(`/api/education-programs/${row.id}`, "PUT", education("-updated"))).response.status).toBe(200);
    expect((await request("/api/education-programs/nope", "PUT", education())).response.status).toBe(400);
    expect((await request("/api/education-programs/999999", "PUT", education())).response.status).toBe(404);
    expect((await request("/api/education-programs/nope", "DELETE")).response.status).toBe(400);
    expect((await request("/api/education-programs/999999", "DELETE")).response.status).toBe(404);
    expect((await request(`/api/education-programs/${row.id}`, "DELETE")).response.status).toBe(200);
  });

  test("facility CRUD and import deduplicates existing and input names", async () => {
    const name = unique("Facility");
    const row = await created("/api/facilities", { ...facility("-create"), nama: name });
    expect(row.nama).toBe(name);
    expect((await api("/api/facilities")).response.status).toBe(200);
    expect((await request(`/api/facilities/${row.id}`, "PUT", facility("-updated"))).response.status).toBe(200);
    expect((await request("/api/facilities/nope", "PUT", facility())).response.status).toBe(400);
    expect((await request("/api/facilities/999999", "PUT", facility())).response.status).toBe(404);
    expect((await request("/api/facilities/nope", "DELETE")).response.status).toBe(400);
    expect((await request("/api/facilities/999999", "DELETE")).response.status).toBe(404);
    expect((await request(`/api/facilities/${row.id}`, "DELETE")).response.status).toBe(200);

    const imported = unique("Imported Facility");
    const result = await request("/api/facilities/import", "POST", [
      { nama: imported }, { nama: imported.toUpperCase(), keterangan: "duplicate" },
      { nama: "Second Facility", keterangan: "", foto: "" },
      { nama: "   " },
    ]);
    expect(result.response.status).toBe(200);
    expect(result.data.message).toContain("2");
    const invalidImport = await request("/api/facilities/import", "POST", [
      { nama: "Malformed Facility", keterangan: 2, foto: 3 },
    ]);
    expect(invalidImport.response.status).toBe(422);
    expect((await request("/api/facilities/import", "POST", [{ nama: imported }])).response.status).toBe(400);
  });

  test("achievement CRUD and import default optional values", async () => {
    const row = await created("/api/achievements", achievement("-create"));
    expect((await request(`/api/achievements/${row.id}`, "PUT", achievement("-updated"))).response.status).toBe(200);
    expect((await request("/api/achievements/nope", "PUT", achievement())).response.status).toBe(400);
    expect((await request("/api/achievements/999999", "PUT", achievement())).response.status).toBe(404);
    expect((await request("/api/achievements/nope", "DELETE")).response.status).toBe(400);
    expect((await request("/api/achievements/999999", "DELETE")).response.status).toBe(404);
    expect((await request(`/api/achievements/${row.id}`, "DELETE")).response.status).toBe(200);
    const imported = await request("/api/achievements/import", "POST", [
      { nama: unique("Prestasi"), tahun: "2026", tingkat: "Kota" },
    ]);
    expect(imported.response.status).toBe(200);
    expect((await request("/api/achievements/import", "POST", [])).response.status).toBe(400);
  });
});

describe("service points and agendas", () => {
  test("service point CRUD and import", async () => {
    const row = await created("/api/service-points", servicePoint("-create"));
    expect((await api("/api/service-points")).response.status).toBe(200);
    expect((await request(`/api/service-points/${row.id}`, "PUT", servicePoint("-updated"))).response.status).toBe(200);
    expect((await request("/api/service-points/nope", "PUT", servicePoint())).response.status).toBe(400);
    expect((await request("/api/service-points/999999", "PUT", servicePoint())).response.status).toBe(404);
    expect((await request("/api/service-points/nope", "DELETE")).response.status).toBe(400);
    expect((await request("/api/service-points/999999", "DELETE")).response.status).toBe(404);
    expect((await request(`/api/service-points/${row.id}`, "DELETE")).response.status).toBe(200);
    const imported = await request("/api/service-points/import", "POST", [
      { nama: unique("Titik"), alamat: "Jalan", penjab: "PJ" },
    ]);
    expect(imported.response.status).toBe(200);
    expect((await request("/api/service-points/import", "POST", [])).response.status).toBe(400);
  });

  test("agenda CRUD preserves omitted optional fields and import deduplicates", async () => {
    const name = unique("Agenda");
    const row = await created("/api/agendas", { ...agenda("-create"), nama: name });
    expect((await api("/api/agendas")).response.status).toBe(200);
    const minimal = { nama: `${name}-updated`, pelaksanaan: "2026-09-13", waktu: "09:00" };
    const updated = await request(`/api/agendas/${row.id}`, "PUT", minimal);
    expect(updated.response.status).toBe(200);
    expect(updated.data.data.lokasi).toBe("Aula");
    expect((await request("/api/agendas/nope", "PUT", agenda())).response.status).toBe(400);
    expect((await request("/api/agendas/999999", "PUT", agenda())).response.status).toBe(404);
    expect((await request("/api/agendas/nope", "DELETE")).response.status).toBe(400);
    expect((await request("/api/agendas/999999", "DELETE")).response.status).toBe(404);
    expect((await request(`/api/agendas/${row.id}`, "DELETE")).response.status).toBe(200);

    const importedName = unique("Imported Agenda");
    const imported = await request("/api/agendas/import", "POST", [
      { nama: importedName, pelaksanaan: "2026", waktu: "08:00" },
      { nama: importedName.toUpperCase(), pelaksanaan: "2026", waktu: "09:00" },
      { nama: "   ", pelaksanaan: "2026", waktu: "10:00" },
    ]);
    expect(imported.response.status).toBe(200);
    expect(imported.data.message).toContain("1");
    expect((await request("/api/agendas/import", "POST", [{ nama: importedName, pelaksanaan: "2026", waktu: "08:00" }])).response.status).toBe(400);
  });
});

describe("download, product, and gallery CRUD", () => {
  test("downloads default values, admin listing, hit, update, not found, and delete", async () => {
    const defaults = await created("/api/downloads", {
      namaFile: "Default download", kategori: "Modul", fileUrl: "/api/files/default.pdf",
    });
    expect(defaults.status).toBe("PUBLISH");
    expect(defaults.tanggalUpload).toBeTruthy();
    const row = await created("/api/downloads", download("-create"));
    expect((await api<any>("/api/downloads")).data.data.some((x: any) => x.id === row.id)).toBe(true);
    expect((await request("/api/downloads/admin")).response.status).toBe(200);
    expect((await api("/api/downloads/nope/hit", { method: "POST" })).response.status).toBe(400);
    expect((await api("/api/downloads/999999/hit", { method: "POST" })).response.status).toBe(404);
    expect((await api<any>(`/api/downloads/${row.id}/hit`, { method: "POST" })).data.data.hits).toBe(1);
    expect((await request(`/api/downloads/${row.id}`, "PUT", download("-updated"))).response.status).toBe(200);
    expect((await request("/api/downloads/nope", "PUT", download())).response.status).toBe(400);
    expect((await request("/api/downloads/999999", "PUT", download())).response.status).toBe(404);
    expect((await request("/api/downloads/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/downloads/${row.id}`, "DELETE")).response.status).toBe(200);
  });

  test("products default values, filtering, CRUD, and not found", async () => {
    const defaults = await created("/api/products", {
      namaProduk: "Default", deskripsi: "d", noHp: "0", penjual: "p", satuan: "pcs", harga: 1,
    });
    expect(defaults.status).toBe("AKTIF");
    expect(defaults.gambar).toBe("");
    const draft = await created("/api/products", { ...product("-draft"), status: "DRAFT" });
    expect((await api<any>("/api/products")).data.data.some((x: any) => x.id === draft.id)).toBe(false);
    expect((await request("/api/products/admin")).response.status).toBe(200);
    expect((await request(`/api/products/${draft.id}`, "PUT", product("-updated"))).response.status).toBe(200);
    expect((await request("/api/products/nope", "PUT", product())).response.status).toBe(400);
    expect((await request("/api/products/999999", "PUT", product())).response.status).toBe(404);
    expect((await request("/api/products/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/products/${draft.id}`, "DELETE")).response.status).toBe(200);
  });

  test("gallery filters drafts and supports update/delete", async () => {
    const draft = await created("/api/gallery", { ...galleryBody("-draft"), status: "DRAFT" });
    expect((await api<any>("/api/gallery")).data.data.some((x: any) => x.id === draft.id)).toBe(false);
    expect((await request("/api/gallery/admin")).response.status).toBe(200);
    expect((await request(`/api/gallery/${draft.id}`, "PUT", galleryBody("-updated"))).response.status).toBe(200);
    expect((await request("/api/gallery/nope", "PUT", galleryBody())).response.status).toBe(400);
    expect((await request("/api/gallery/999999", "PUT", galleryBody())).response.status).toBe(404);
    expect((await request("/api/gallery/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/gallery/${draft.id}`, "DELETE")).response.status).toBe(200);
  });
});

describe("alumni CRUD, privacy, imports, and shared photos", () => {
  test("public response omits private fields and update preserves optional berkas", async () => {
    const row = await created("/api/alumni", {
      ...alumniBody("-create"), berkas: { kk: "/api/files/kk-create.pdf" },
    });
    const publicList = await api<any>("/api/alumni");
    const publicRow = publicList.data.data.find((x: any) => x.id === row.id);
    expect(publicRow).toBeTruthy();
    expect(publicRow.nik).toBeUndefined();
    const updated = await request(`/api/alumni/${row.id}`, "PUT", alumniBody("-updated"));
    expect(updated.response.status).toBe(200);
    expect(updated.data.data.berkas).toEqual({ kk: "/api/files/kk-create.pdf" });
    expect((await request("/api/alumni/nope", "PUT", alumniBody())).response.status).toBe(400);
    expect((await request("/api/alumni/999999", "PUT", alumniBody())).response.status).toBe(404);
    expect((await request("/api/alumni/nope", "DELETE")).response.status).toBe(400);
    expect((await request(`/api/alumni/${row.id}`, "DELETE")).response.status).toBe(200);
  });

  test("student-shared alumni photo is retained on update and delete", async () => {
    const shared = `/api/files/shared-${unique("photo")}.png`;
    const student = await createStudent({ foto: shared });
    const first = await created("/api/alumni", { ...alumniBody("-shared-update"), foto: shared });
    const updated = await request(`/api/alumni/${first.id}`, "PUT", alumniBody("-replacement"));
    expect(updated.response.status).toBe(200);
    const second = await created("/api/alumni", { ...alumniBody("-shared-delete"), foto: shared });
    expect((await request(`/api/alumni/${second.id}`, "DELETE")).response.status).toBe(200);
    await db.delete(models.students).where((await import("drizzle-orm")).eq(models.students.id, student.id)).run();
  });

  test("alumni import filters duplicate names and rejects no valid rows", async () => {
    const name = unique("Imported Alumni");
    const first = alumniBody("-import-one");
    const second = alumniBody("-import-two");
    const result = await request("/api/alumni/import", "POST", [
      { ...first, nama: name }, { ...second, nama: name.toUpperCase() },
      { ...alumniBody("-blank"), nama: "   " },
    ]);
    expect(result.response.status).toBe(200);
    expect(result.data.message).toContain("1");
    expect((await request("/api/alumni/import", "POST", [{ ...alumniBody("-again"), nama: name }])).response.status).toBe(400);
  });
});

