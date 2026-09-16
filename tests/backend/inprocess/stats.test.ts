import { beforeAll, describe, expect, test } from "bun:test";
import { api, db, login, models } from "../helpers/in-process-app";
import { createManager, createStudent, createTutor } from "../helpers/db-fixtures";

let token: string;
let tutorId: number;

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "stats-admin" });
  token = await login(admin.email, "stats-admin");
  tutorId = (await createTutor()).id;
});

describe("stats service", () => {
  test("public stats menghitung siswa aktif dan entitas publik", async () => {
    await createStudent({ status: "AKTIF" });
    await createStudent({ status: "LULUS" });
    await db.insert(models.servicePoints).values({ nama: "Titik Test" }).run();

    const { response, data } = await api<any>("/api/public-stats");
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.students).toBeGreaterThanOrEqual(1);
    expect(data.data.servicePoints).toBeGreaterThanOrEqual(1);
  });

  test("dashboard memerlukan admin dan menghitung paket/material aktif", async () => {
    expect((await api("/api/dashboard-stats")).response.status).toBe(401);

    await createStudent({ status: "AKTIF", program: "PAKET A" });
    await createStudent({ status: "AKTIF", program: "PAKET B" });
    await createStudent({ status: "AKTIF", program: "PAKET C" });
    await createStudent({ status: "AKTIF", program: "Program Mandiri" });
    await db.insert(models.products).values([
      { namaProduk: "Aktif", status: "AKTIF" },
      { namaProduk: "Nonaktif", status: "NONAKTIF" },
    ]).run();
    await db.insert(models.elearningSetups).values({
      kelas: "PAKET C 10 A",
      mapel: "Statistika",
      tutorId,
      skk: 1,
      jumlahSesi: 1,
      semester: "Ganjil",
    }).run();
    const course = await db.insert(models.elearningCourses).values({
      namaMapel: `Statistika-${Date.now()}`,
      program: "PAKET C",
      kelas: "10",
    }).returning().get();
    const session = await db.insert(models.elearningSessions).values({
      courseId: course.id,
      sessionNumber: 1,
      title: "Pertemuan Statistik",
    }).returning().get();
    await db.insert(models.elearningMaterials).values([
      { sessionId: session.id, title: "Tugas", type: "TUGAS" },
      { sessionId: session.id, title: "Modul", type: "PDF" },
    ]).run();

    const { response, data } = await api<any>("/api/dashboard-stats", { token });
    expect(response.status).toBe(200);
    expect(data.data.paketA).toBeGreaterThanOrEqual(1);
    expect(data.data.paketB).toBeGreaterThanOrEqual(1);
    expect(data.data.paketC).toBeGreaterThanOrEqual(1);
    expect(data.data.products).toBeGreaterThanOrEqual(1);
    expect(data.data.mapelAktif).toBeGreaterThanOrEqual(1);
    expect(data.data.tugas).toBeGreaterThanOrEqual(1);
  });
});
