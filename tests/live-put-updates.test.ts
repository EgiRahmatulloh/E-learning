// Integration test live-server: semua PUT /:id + PATCH approve-angket.
// Setiap entitas: create → update (nilai berubah) → verifikasi → delete.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-put-updates.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

/** Pola generik: create → PUT → pastikan field berubah → DELETE. */
async function putCycle(
  base: string,
  createBody: Record<string, unknown>,
  updateBody: Record<string, unknown>,
  checkKey: string,
  checkValue: string,
) {
  const id = createdId(await api(base, { method: "POST", headers: json(), body: JSON.stringify(createBody) }));
  try {
    const upd = await api(`${base}/${id}`, {
      method: "PUT", headers: json(), body: JSON.stringify(updateBody),
    });
    expect(upd.status).toBe(200);
    expect(String((upd.body as { data: Record<string, unknown> }).data[checkKey])).toBe(checkValue);

    // Tanpa token → 401
    const noAuth = await api(`${base}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateBody),
    });
    expect(noAuth.status).toBe(401);
  } finally {
    await api(`${base}/${id}`, { method: "DELETE", headers: H() });
  }
}

describe("PUT konten: announcements → gallery", () => {
  test("announcements/:id", async () => {
    const text = tag("PGM");
    await putCycle(
      "/api/announcements",
      { text, date: "10-09-2026" },
      { text: `${text}-UBAH`, date: "11-09-2026", status: "TIDAK AKTIF" },
      "text", `${text}-UBAH`,
    );
  });

  test("achievements/:id", async () => {
    const nama = tag("PRS");
    await putCycle(
      "/api/achievements",
      { nama, tahun: "2026", tingkat: "K", penyelenggara: "D", peserta: "W", keterangan: "k", foto: "" },
      { nama: `${nama}-UBAH`, tahun: "2026", tingkat: "K", penyelenggara: "D", peserta: "W", keterangan: "k", foto: "" },
      "nama", `${nama}-UBAH`,
    );
  });

  test("service-points/:id", async () => {
    const nama = tag("TP");
    await putCycle(
      "/api/service-points",
      { nama, alamat: "j", penjab: "p", waktuPembelajaran: "pg", jumlahWb: "1", keterangan: "k", foto: "" },
      { nama: `${nama}-UBAH`, alamat: "j", penjab: "p", waktuPembelajaran: "pg", jumlahWb: "1", keterangan: "k", foto: "" },
      "nama", `${nama}-UBAH`,
    );
  });

  test("agendas/:id", async () => {
    const nama = tag("AGD");
    await putCycle(
      "/api/agendas",
      { nama, pelaksanaan: "10-09-2026", waktu: "08:00", peserta: "W", lokasi: "R", penyelenggara: "P", penanggungjawab: "J", keterangan: "k", foto: "" },
      { nama: `${nama}-UBAH`, pelaksanaan: "11-09-2026", waktu: "09:00", peserta: "W", lokasi: "R", penyelenggara: "P", penanggungjawab: "J", keterangan: "k", foto: "" },
      "nama", `${nama}-UBAH`,
    );
  });

  test("downloads/:id (PUT wajib semua field termasuk tanggalUpload)", async () => {
    const nama = tag("DL");
    await putCycle(
      "/api/downloads",
      { namaFile: nama, kategori: "MODUL", fileUrl: "/api/files/a.pdf" },
      { namaFile: `${nama}-UBAH`, kategori: "MODUL", fileUrl: "/api/files/a.pdf", status: "DRAFT", tanggalUpload: "10 September 2026" },
      "namaFile", `${nama}-UBAH`,
    );
  });

  test("products/:id (PUT wajib semua field termasuk status+gambar)", async () => {
    const nama = tag("PRD");
    await putCycle(
      "/api/products",
      { namaProduk: nama, deskripsi: "d", noHp: "0", penjual: "p", satuan: "pcs", harga: 1000 },
      { namaProduk: `${nama}-UBAH`, deskripsi: "d", noHp: "0", penjual: "p", satuan: "pcs", harga: 2000, status: "AKTIF", gambar: "" },
      "namaProduk", `${nama}-UBAH`,
    );
  });

  test("gallery/:id", async () => {
    const nama = tag("GLR");
    await putCycle(
      "/api/gallery",
      { namaFile: nama, kategori: "KEGIATAN", tanggalPosting: "10-09-2026", foto: "[]", status: "PUBLISH" },
      { namaFile: `${nama}-UBAH`, kategori: "KEGIATAN", tanggalPosting: "10-09-2026", foto: "[]", status: "DRAFT" },
      "namaFile", `${nama}-UBAH`,
    );
  });
});

describe("PUT data: news, tutors, students, managers, rombels, alumni", () => {
  test("news/:id (status ikut berubah)", async () => {
    const judul = tag("BRT");
    await putCycle(
      "/api/news",
      { judul, kategori: "X", tanggalPosting: "10-09-2026" },
      { judul: `${judul}-UBAH`, kategori: "X", tanggalPosting: "10-09-2026", status: "DRAFT", foto: "", konten: "isi" },
      "judul", `${judul}-UBAH`,
    );
  });

  test("tutors/:id", async () => {
    const nama = tag("TTR");
    await putCycle("/api/tutors", { nama }, { nama: `${nama}-UBAH` }, "nama", `${nama}-UBAH`);
  });

  test("students/:id", async () => {
    const nama = tag("SSW");
    await putCycle("/api/students", { nama }, { nama: `${nama}-UBAH` }, "nama", `${nama}-UBAH`);
  });

  test("rombels/:id", async () => {
    const nama = tag("RMB");
    await putCycle("/api/rombels", { nama }, { nama: `${nama}-UBAH` }, "nama", `${nama}-UBAH`);
  });

  test("managers/:id (PUT wajib 16 field penuh)", async () => {
    const nama = tag("MGR");
    const email = `${nama.toLowerCase()}@x.id`;
    const full = (n: string) => ({
      nama: n, nik: "NIK1", jabatan: "Sekretaris", nip: "-", tempatTglLahir: "-",
      jenisKelamin: "L", agama: "Islam", pendidikan: "S1", email,
      tanggalMulaiTugas: "2020-01-01", nomorSkPengangkatan: "-", lembagaPengangkat: "D",
      nomorSkPenugasan: "-", lembagaPenugas: "P", alamat: "Jl", foto: "",
    });
    const id = createdId(
      await api("/api/managers", { method: "POST", headers: json(), body: JSON.stringify(full(nama)) }),
    );
    try {
      const upd = await api(`/api/managers/${id}`, {
        method: "PUT", headers: json(),
        body: JSON.stringify({ ...full(`${nama}-UBAH`), jabatan: "Ketua" }),
      });
      expect(upd.status).toBe(200);
      expect((upd.body as { data: { nama: string; jabatan: string } }).data.nama).toBe(`${nama}-UBAH`);
      expect((upd.body as { data: { nama: string; jabatan: string } }).data.jabatan).toBe("Ketua");
    } finally {
      await api(`/api/managers/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("alumni/:id (POST+PUT wajib 24 field penuh)", async () => {
    const nama = tag("ALM");
    const full = (n: string) => ({
      nama: n, nik: "NIK1", program: "PAKET C", tahunLulus: "2026", nisn: "NS1", nis: "N1",
      tempatTglLahir: "Ciamis", noHp: "0", namaAyah: "A", namaIbu: "I", jenisKelamin: "L",
      agama: "Islam", email: `${tag("ALM").toLowerCase()}@x.id`, alamat: "Jl", rt: "", rw: "",
      desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "-", pekerjaan: "Tani",
      cerita: "-", foto: "",
    });
    const id = createdId(
      await api("/api/alumni", { method: "POST", headers: json(), body: JSON.stringify(full(nama)) }),
    );
    try {
      const upd = await api(`/api/alumni/${id}`, {
        method: "PUT", headers: json(),
        body: JSON.stringify(full(`${nama}-UBAH`)),
      });
      expect(upd.status).toBe(200);
      expect((upd.body as { data: { nama: string } }).data.nama).toBe(`${nama}-UBAH`);
    } finally {
      await api(`/api/alumni/${id}`, { method: "DELETE", headers: H() });
    }
  });
});

describe("PUT e-learning: setups + PATCH approve-angket + forum edit", () => {
  test("setups/:id update skk/jumlahSesi", async () => {
    const kelas = tag("KLS");
    const id = createdId(
      await api("/api/elearning/setups", {
        method: "POST", headers: json(),
        body: JSON.stringify({ kelas, mapel: "M", tutorId: 7, skk: 1, jumlahSesi: 2 }),
      }),
    );
    try {
      const upd = await api(`/api/elearning/setups/${id}`, {
        method: "PUT", headers: json(),
        body: JSON.stringify({ kelas, mapel: "M", tutorId: 7, skk: 3, jumlahSesi: 6 }),
      });
      expect(upd.status).toBe(200);
      expect((upd.body as { data: { skk: number; jumlahSesi: number } }).data.skk).toBe(3);
    } finally {
      await api(`/api/elearning/setups/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("approve-angket butuh boolean; true menandai setup", async () => {
    const id = createdId(
      await api("/api/elearning/setups", {
        method: "POST", headers: json(),
        body: JSON.stringify({ kelas: tag("K"), mapel: "M", tutorId: 7, skk: 1, jumlahSesi: 2 }),
      }),
    );
    try {
      const noBody = await api(`/api/elearning/setups/${id}/approve-angket`, {
        method: "PATCH", headers: json(), body: JSON.stringify({}),
      });
      expect(noBody.status).toBe(422);

      const ok = await api(`/api/elearning/setups/${id}/approve-angket`, {
        method: "PATCH", headers: json(), body: JSON.stringify({ isAngketApproved: true }),
      });
      expect(ok.status).toBe(200);
      expect((ok.body as { data: { isAngketApproved: boolean } }).data.isAngketApproved).toBe(true);
    } finally {
      await api(`/api/elearning/setups/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("forum/:id edit membersihkan XSS", async () => {
    const subjectName = tag("FEDIT");
    const courseId = (
      (await api("/api/elearning/course", {
        method: "POST", headers: json(), body: JSON.stringify({ subjectName, program: "PAKET C" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    const sessionId = (
      (
        await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
      ) as { body: { data: { session: { id: number } } } }
    ).body.data.session.id;
    const postId = (
      (await api("/api/elearning/forum", {
        method: "POST", headers: json(),
        body: JSON.stringify({ sessionId, courseId, content: "awal" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    try {
      const upd = await api(`/api/elearning/forum/${postId}`, {
        method: "PUT", headers: json(),
        body: JSON.stringify({ content: "ubah<script>alert(1)</script>" }),
      });
      expect(upd.status).toBe(200);
      expect((upd.body as { data: { content: string } }).data.content).not.toContain("<script>");
    } finally {
      await api(`/api/elearning/forum/${postId}`, { method: "DELETE", headers: H() });
    }
  });
});
