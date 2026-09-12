import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unzipSync } from "fflate";
import { mkdir, rm } from "node:fs/promises";
import Jimp from "jimp";
import * as XLSX from "xlsx";
import { api, apiBytes, db, login, models } from "../helpers/in-process-app";
import {
  assignStudent,
  createCourse,
  createManager,
  createRombel,
  createSession,
  createStudent,
  createTutor,
} from "../helpers/db-fixtures";

let adminToken: string;
let tutorToken: string;
let studentToken: string;
let otherStudentToken: string;
let setupId: number;
let noCourseSetupId: number;
let emptySetupId: number;
let mainSessionId: number;
let emptySessionId: number;
let noAssignmentSessionId: number;
let submissionId: number;
let png: string;

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const mainClass = `PAKET C 10 REPORT ${runId}`;
const secondClass = `PAKET C 10 REKAP ${runId}`;
const noSetupClass = `PAKET C 10 NOSETUP ${runId}`;
const noCourseClass = `PAKET B 8 NOCOURSE ${runId}`;
const emptyClass = `PAKET A 6 EMPTY ${runId}`;
const mainMapel = `Matematika / Wajib ${runId}`;
const secondMapel = `Bahasa & Seni ${runId}`;
const orphanMapel = `Mapel Orphan ${runId}`;
const noCourseMapel = `Mapel Tanpa Course ${runId}`;
const emptyMapel = `Mapel Kosong ${runId}`;
const mainStudentName = `Siswa / Utama ${runId}`;
const absentStudentName = `Siswa Tidak Hadir ${runId}`;
const unknownId = 2_000_000_000;
const replacementFileName = `report-replacement-${runId}.txt`;
const replacementPath = `./uploads/${replacementFileName}`;

const now = new Date();
const currentDate = new Date(now.getFullYear(), now.getMonth(), 12, 12).toISOString();
const oldDate = new Date(now.getFullYear() - 1, now.getMonth(), 12, 12).toISOString();

async function expectXlsx(path: string, token = adminToken) {
  const result = await apiBytes(path, { token });
  expect(result.response.status).toBe(200);
  expect(result.response.headers.get("content-type")).toContain("spreadsheetml.sheet");
  const bytes = Buffer.from(result.data);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  expect(() => XLSX.read(bytes, { type: "buffer" })).not.toThrow();
  return result;
}

beforeAll(async () => {
  const signatureBuffer = await new Jimp(2, 2, 0xff0000ff).getBufferAsync(Jimp.MIME_PNG);
  png = `data:image/png;base64,${signatureBuffer.toString("base64")}`;
  const admin = await createManager({
    plainPassword: "report-admin",
    nama: "Kepala PKBM",
    jabatan: "Kepala PKBM",
    nip: "19700101",
  });
  const tutor = await createTutor({
    plainPassword: "report-tutor",
    nama: `Tutor Laporan ${runId}`,
    nip: "19800101",
    tutorMapel: mainMapel,
  });
  const student = await createStudent({
    plainPassword: "report-student",
    nama: mainStudentName,
    nis: `NIS-1-${runId}`,
    nisn: `NISN-1-${runId}`,
    jenisKelamin: "L",
    kelas: mainClass,
  });
  const otherStudent = await createStudent({
    plainPassword: "report-student-2",
    nama: absentStudentName,
    nis: "",
    nisn: "",
    jenisKelamin: "",
    kelas: mainClass,
  });
  const thirdStudent = await createStudent({
    plainPassword: "report-student-3",
    nama: `Siswa Kelas B ${runId}`,
    nis: `NIS-3-${runId}`,
    nisn: `NISN-3-${runId}`,
    jenisKelamin: "P",
    kelas: secondClass,
  });
  const noSetupStudent = await createStudent({
    plainPassword: "report-student-4",
    nama: `Siswa Tanpa Setup Mapel ${runId}`,
    kelas: noSetupClass,
  });

  adminToken = await login(admin.email, "report-admin");
  tutorToken = await login(tutor.email, "report-tutor");
  studentToken = await login(student.email, "report-student");
  otherStudentToken = await login(otherStudent.email, "report-student-2");

  const rombel = await createRombel({ nama: mainClass, waliKelasId: tutor.id });
  const secondRombel = await createRombel({ nama: secondClass, waliKelasId: null });
  const noSetupRombel = await createRombel({ nama: noSetupClass, waliKelasId: null });
  await assignStudent(rombel.id, student.id);
  await assignStudent(rombel.id, otherStudent.id);
  await assignStudent(secondRombel.id, student.id); // dedupe branches in recap reports
  await assignStudent(secondRombel.id, thirdStudent.id);
  await assignStudent(noSetupRombel.id, noSetupStudent.id);

  const course = await createCourse({ namaMapel: mainMapel, program: "Paket C", kelas: "10" });
  const secondCourse = await createCourse({ namaMapel: secondMapel, program: "Paket C", kelas: "10" });
  const mainSession = await createSession(course.id, {
    sessionNumber: 1,
    title: "Pertemuan Utama",
    description: "<p>Aljabar &amp; fungsi&nbsp;linear</p>",
    tujuanPembelajaran: "<b>Memahami &lt;fungsi&gt;</b>",
    uraianKegiatan: "<div>Diskusi &gt; latihan</div>",
    startDate: currentDate,
    updatedAt: currentDate,
  });
  mainSessionId = mainSession.id;
  await createSession(course.id, {
    sessionNumber: 0,
    title: "Pendahuluan",
    description: "",
    startDate: oldDate,
  });
  const secondSession = await createSession(course.id, {
    sessionNumber: 2,
    title: "Pertemuan Kosong",
    description: "",
    tujuanPembelajaran: "",
    uraianKegiatan: "",
    startDate: null,
    updatedAt: null,
  });
  emptySessionId = secondSession.id;
  const thirdSession = await createSession(course.id, { sessionNumber: 3, title: "Tanpa Tugas" });
  noAssignmentSessionId = thirdSession.id;
  const foreignSession = await createSession(secondCourse.id, {
    sessionNumber: 1,
    title: "Bahasa",
    startDate: currentDate,
  });

  const setup = await db.insert(models.elearningSetups).values({
    kelas: mainClass,
    mapel: mainMapel,
    tutorId: tutor.id,
    jumlahSesi: 3,
    semester: "Genap",
  }).returning().get();
  setupId = setup.id;
  await db.insert(models.elearningSetups).values({
    kelas: secondClass,
    mapel: secondMapel,
    tutorId: tutor.id,
    jumlahSesi: 0,
    semester: "",
  }).run();
  await db.insert(models.elearningSetups).values({
    kelas: secondClass,
    mapel: orphanMapel,
    tutorId: tutor.id,
    jumlahSesi: 0,
    semester: "",
  }).run();
  const noCourseSetup = await db.insert(models.elearningSetups).values({
    kelas: noCourseClass,
    mapel: noCourseMapel,
    tutorId: tutor.id,
    jumlahSesi: 0,
    semester: "",
  }).returning().get();
  noCourseSetupId = noCourseSetup.id;
  await createCourse({ namaMapel: emptyMapel, program: "Paket A", kelas: "6" });
  const emptySetup = await db.insert(models.elearningSetups).values({
    kelas: emptyClass,
    mapel: emptyMapel,
    tutorId: tutor.id,
    semester: "Ganjil",
  }).returning().get();
  emptySetupId = emptySetup.id;

  await db.insert(models.elearningMaterials).values([
    { sessionId: mainSession.id, title: "<i>Judul cadangan</i>", type: "PDF", fileUrl: "" },
    { sessionId: secondSession.id, title: "<b>Materi unggah</b>", type: "PDF", fileUrl: "" },
    { sessionId: secondSession.id, title: "&nbsp;", type: "PDF", fileUrl: "" },
  ]).run();
  await db.insert(models.elearningAttendances).values({
    sessionId: mainSession.id,
    studentId: student.id,
    signature: png,
    attendedAt: currentDate,
    createdAt: oldDate,
  }).run();
  await db.insert(models.elearningForumPosts).values([
    { sessionId: mainSession.id, courseId: course.id, authorId: student.id, authorRole: "siswa", content: "hadir" },
    { sessionId: mainSession.id, courseId: course.id, authorId: tutor.id, authorRole: "tutor", content: "materi", createdAt: currentDate },
    { sessionId: foreignSession.id, courseId: secondCourse.id, authorId: tutor.id, authorRole: "tutor", content: "asing", createdAt: oldDate },
  ]).run();
  await db.insert(models.tutorAttendances).values([
    { tutorId: tutor.id, date: currentDate.slice(0, 10), signature: png },
    { tutorId: tutor.id, date: oldDate.slice(0, 10), signature: "" },
  ]).run();

  const assignment = await db.insert(models.elearningAssignments).values({
    sessionId: mainSession.id,
    title: "Tugas utama",
    description: "",
    fileUrl: "",
  }).returning().get();
  await db.insert(models.elearningAssignments).values({
    sessionId: secondSession.id,
    title: "Tugas tanpa berkas",
    description: "",
    fileUrl: "",
  }).run();
  const submission = await db.insert(models.elearningSubmissions).values({
    assignmentId: assignment.id,
    studentId: student.id,
    fileUrl: "/api/files/report-local.txt",
    grade: 90,
    feedback: "baik",
  }).returning().get();
  submissionId = submission.id;
});

afterAll(async () => {
  await rm(replacementPath, { force: true });
});

// Inventory: laporan has 7 route callbacks and stripHtml; submissions has 4 route callbacks.
describe("elearning reports auth and validation", () => {
  test("all seven report routes require authentication", async () => {
    for (const path of [
      "/api/elearning/laporan/tutor-attendance",
      "/api/elearning/laporan/student-attendance?setupId=1",
      "/api/elearning/laporan/student-attendance-rekap",
      "/api/elearning/laporan/student-attendances?setupId=1",
      "/api/elearning/laporan/student-grades?setupId=1",
      "/api/elearning/laporan/student-grades-rekap",
      "/api/elearning/laporan/tutor-agenda?setupId=1",
    ]) expect((await api(path)).response.status).toBe(401);
  });

  test("admin-only recaps reject students while tutor report accepts tutor", async () => {
    for (const path of [
      "/api/elearning/laporan/tutor-attendance",
      "/api/elearning/laporan/student-attendance-rekap",
      "/api/elearning/laporan/student-grades-rekap",
    ]) expect((await api(path, { token: studentToken })).response.status).toBe(403);
    expect((await api(`/api/elearning/laporan/student-attendances?setupId=${setupId}`, { token: tutorToken })).response.status).toBe(200);
  });

  test("per-setup routes validate missing, nonnumeric, and unknown setupId", async () => {
    for (const path of [
      "/api/elearning/laporan/student-attendance",
      "/api/elearning/laporan/student-attendances",
      "/api/elearning/laporan/student-grades",
      "/api/elearning/laporan/tutor-agenda",
    ]) {
      expect((await api(path, { token: adminToken })).response.status).toBe(400);
      expect((await api(`${path}?setupId=abc`, { token: adminToken })).response.status).toBe(400);
      expect((await api(`${path}?setupId=${unknownId}`, { token: adminToken })).response.status).toBe(404);
    }
  });

  test("recaps return not found for filters without setups", async () => {
    const unmatchedClass = encodeURIComponent(`PAKET A 1 NONE ${runId}`);
    expect((await api(`/api/elearning/laporan/student-attendance-rekap?kelas=${unmatchedClass}`, { token: adminToken })).response.status).toBe(404);
    expect((await api(`/api/elearning/laporan/student-grades-rekap?kelas=${unmatchedClass}`, { token: adminToken })).response.status).toBe(404);
    expect((await api("/api/elearning/laporan/student-grades-rekap?level=99", { token: adminToken })).response.status).toBe(404);
  });
});

describe("elearning report data and XLSX outputs", () => {
  test("student attendance JSON aggregates signatures and empty course/rombel paths", async () => {
    const populated = await api<any>(`/api/elearning/laporan/student-attendances?setupId=${setupId}`, { token: tutorToken });
    expect(populated.response.status).toBe(200);
    expect(populated.data.success).toBe(true);
    expect(populated.data.data.some((row: any) => row.namaSiswa === mainStudentName)).toBe(true);
    const mainRow = populated.data.data.find((row: any) => row.namaSiswa === mainStudentName);
    const absentRow = populated.data.data.find((row: any) => row.namaSiswa === absentStudentName);
    expect(mainRow.signatureByDay["d12"]).toBe(png);
    expect(mainRow.rekap).toBe(1);
    expect(absentRow.rekap).toBe(0);
    expect(populated.data.daysInMonth).toBeGreaterThan(27);

    const noCourse = await api<any>(`/api/elearning/laporan/student-attendances?setupId=${noCourseSetupId}`, { token: adminToken });
    expect(noCourse.response.status).toBe(200);
    expect(noCourse.data.data).toEqual([]);
    const noRombel = await api<any>(`/api/elearning/laporan/student-attendances?setupId=${emptySetupId}`, { token: adminToken });
    expect(noRombel.data.data).toEqual([]);
  });

  test("per-mapel attendance XLSX is valid for populated and empty datasets", async () => {
    const populated = await expectXlsx(`/api/elearning/laporan/student-attendance?setupId=${setupId}`, tutorToken);
    expect(populated.response.headers.get("content-disposition")).toContain(
      `${mainMapel.replace(/\s+/g, "_")}_${mainClass.replace(/\s+/g, "_")}`,
    );
    await expectXlsx(`/api/elearning/laporan/student-attendance?setupId=${emptySetupId}`);
  });

  test("tutor attendance XLSX covers all, class and A/B/C level filters", async () => {
    for (const suffix of [
      "", `?kelas=${encodeURIComponent(mainClass)}`, "?level=10", "?level=8",
      "?level=6", "?kelas=Semua&level=Semua", `?kelas=${encodeURIComponent(`UNKNOWN ${runId}`)}`,
    ]) {
      const report = await expectXlsx(`/api/elearning/laporan/tutor-attendance${suffix}`);
      expect(report.response.headers.get("content-disposition")).toContain("laporan_kehadiran_tutor_");
    }
  });

  test("attendance recap XLSX covers class, levels, all classes, and empty students", async () => {
    for (const suffix of [`?kelas=${encodeURIComponent(mainClass)}`, "?level=10", "?level=8", "?level=6", ""]) {
      const report = await expectXlsx(`/api/elearning/laporan/student-attendance-rekap${suffix}`);
      expect(report.response.headers.get("content-disposition")).toContain("rekap_kehadiran_wb_");
    }
  });

  test("student grades XLSX aggregates values and sanitizes filename", async () => {
    const populated = await expectXlsx(`/api/elearning/laporan/student-grades?setupId=${setupId}`, tutorToken);
    const disposition = populated.response.headers.get("content-disposition")!;
    expect(disposition).toContain(`nilai_wb_${mainMapel.replace(/[^a-zA-Z0-9._\-\s]/g, "_").replace(/\s+/g, "_")}_`);
    expect(disposition).not.toContain("/Wajib");
    await expectXlsx(`/api/elearning/laporan/student-grades?setupId=${noCourseSetupId}`);
    await expectXlsx(`/api/elearning/laporan/student-grades?setupId=${emptySetupId}`);
  });

  test("grades recap XLSX covers all/class/levels, missing course, and defaults", async () => {
    for (const suffix of [
      "",
      `?kelas=${encodeURIComponent(mainClass)}`,
      `?kelas=${encodeURIComponent(secondClass)}`,
      "?level=10",
      "?level=8",
      "?level=6",
    ]) {
      const report = await expectXlsx(`/api/elearning/laporan/student-grades-rekap${suffix}`);
      expect(report.response.headers.get("content-disposition")).toContain("rekap_nilai_wb_");
    }
  });

  test("tutor agenda XLSX covers description/material/fallback and absent names", async () => {
    const report = await expectXlsx(`/api/elearning/laporan/tutor-agenda?setupId=${setupId}`, tutorToken);
    expect(report.response.headers.get("content-disposition")).toContain(
      `agenda_tutor_${mainMapel.replace(/[^a-zA-Z0-9._\-\s]/g, "_").replace(/\s+/g, "_")}_`,
    );
    await expectXlsx(`/api/elearning/laporan/tutor-agenda?setupId=${noCourseSetupId}`);
    await expectXlsx(`/api/elearning/laporan/tutor-agenda?setupId=${emptySetupId}`);
  });
});

describe("submissions API", () => {
  test("all four routes require authentication and enforce roles", async () => {
    expect((await api(`/api/elearning/submissions/${mainSessionId}`)).response.status).toBe(401);
    expect((await api(`/api/elearning/submissions/${mainSessionId}`, { method: "POST", json: { fileUrl: "x" } })).response.status).toBe(401);
    expect((await api(`/api/elearning/submissions/${submissionId}/grade`, { method: "PUT", json: { grade: 80 } })).response.status).toBe(401);
    expect((await api(`/api/elearning/submissions/${mainSessionId}/download-zip`)).response.status).toBe(401);
    const denied = await api<any>(`/api/elearning/submissions/${mainSessionId}`, {
      method: "POST", token: adminToken, json: { fileUrl: "x" },
    });
    expect(denied.data.success).toBe(false);
    expect((await api(`/api/elearning/submissions/${submissionId}/grade`, {
      method: "PUT", token: studentToken, json: { grade: 80 },
    })).response.status).toBe(403);
  });

  test("GET validates session, returns empty assignment and populated left join", async () => {
    expect((await api("/api/elearning/submissions/abc", { token: adminToken })).response.status).toBe(400);
    const empty = await api<any>(`/api/elearning/submissions/${noAssignmentSessionId}`, { token: adminToken });
    expect(empty.data).toEqual({ success: true, data: [] });
    const list = await api<any>(`/api/elearning/submissions/${mainSessionId}`, { token: adminToken });
    const submission = list.data.data.find((row: any) => row.id === submissionId);
    expect(submission).toMatchObject({ id: submissionId, studentName: mainStudentName, grade: 90 });
  });

  test("POST creates assignment/submission then handles resubmission", async () => {
    expect((await api("/api/elearning/submissions/abc", {
      method: "POST", token: otherStudentToken, json: { fileUrl: "/api/files/a.txt" },
    })).response.status).toBe(400);
    expect((await api(`/api/elearning/submissions/${noAssignmentSessionId}`, {
      method: "POST", token: otherStudentToken, json: { fileUrl: "/api/files/new.txt" },
    })).response.status).toBe(200);
    expect((await api(`/api/elearning/submissions/${noAssignmentSessionId}`, {
      method: "POST", token: otherStudentToken, json: { fileUrl: "/api/files/newer.txt" },
    })).response.status).toBe(200);
    expect((await api(`/api/elearning/submissions/${mainSessionId}`, {
      method: "POST", token: studentToken, json: { fileUrl: `/api/files/${replacementFileName}` },
    })).response.status).toBe(200);
    const { eq } = await import("drizzle-orm");
    const row = await db.select().from(models.elearningSubmissions)
      .where(eq(models.elearningSubmissions.id, submissionId)).get();
    expect(row?.fileUrl).toBe(`/api/files/${replacementFileName}`);
    expect(row?.grade).toBeNull();
  });

  test("PUT grade validates id/range, updates, and returns not found", async () => {
    expect((await api("/api/elearning/submissions/abc/grade", {
      method: "PUT", token: adminToken, json: { grade: 50 },
    })).response.status).toBe(400);
    for (const grade of [-1, 101]) {
      expect((await api(`/api/elearning/submissions/${submissionId}/grade`, {
        method: "PUT", token: tutorToken, json: { grade },
      })).response.status).toBe(400);
    }
    expect((await api(`/api/elearning/submissions/${unknownId}/grade`, {
      method: "PUT", token: adminToken, json: { grade: 75 },
    })).response.status).toBe(404);
    expect((await api(`/api/elearning/submissions/${submissionId}/grade`, {
      method: "PUT", token: tutorToken, json: { grade: 88, feedback: "mantap" },
    })).response.status).toBe(200);
  });

  test("download ZIP validates empties and packages local file with sanitized name", async () => {
    expect((await api("/api/elearning/submissions/abc/download-zip", { token: adminToken })).response.status).toBe(400);
    expect((await api(`/api/elearning/submissions/${unknownId}/download-zip`, { token: adminToken })).response.status).toBe(404);
    expect((await api(`/api/elearning/submissions/${emptySessionId}/download-zip`, { token: adminToken })).response.status).toBe(404);

    await mkdir("./uploads", { recursive: true });
    await Bun.write(replacementPath, "submission bytes");
    const zipped = await apiBytes(`/api/elearning/submissions/${mainSessionId}/download-zip`, { token: tutorToken });
    expect(zipped.response.status).toBe(200);
    expect(zipped.response.headers.get("content-type")).toContain("application/zip");
    const files = unzipSync(zipped.data);
    const expectedZipName = `${mainStudentName.replace(/[^a-zA-Z0-9]/g, "_")}_Tugas.txt`;
    expect(new TextDecoder().decode(files[expectedZipName])).toBe("submission bytes");
  });
});

