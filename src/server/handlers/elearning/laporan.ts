// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../../config/db";
import {
  eq,
  and,
  or,
  inArray,
  isNull,
  like,
  desc,
  asc,
  sql,
} from "drizzle-orm";
import {
  elearningCourses,
  elearningSessions,
  elearningMaterials,
  elearningEvaluations,
  elearningSetups,
  elearningForumPosts,
  elearningAttendances,
  elearningAssignments,
  elearningSubmissions,
  elearningQuestions,
  elearningQuizSubmissions,
  elearningSectionCompletions,
  tutors,
  students,
  rombels,
  rombelStudents,
  managers,
  tutorAttendances,
  elearningSessionAngkets,
} from "../../models";
import { verifyAdmin, verifyAdminOrTutor } from "../../middleware/auth";

import {
  verifyUser,
  sanitizeFilename,
  deriveProgram,
  extractLevel,
  buildAttendanceGrid,
  calculateGrade,
  getTahunAjaran,
} from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";

const stripHtml = (input?: string | null): string =>
  (input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// ==========================================
// LAPORAN TEMPLATE DOWNLOADS
// ==========================================

// GET Laporan Kehadiran Tutor (xlsx template)
export const laporanHandlers = new Elysia()
  .get("/laporan/tutor-attendance", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const filterKelas =
        query.kelas && query.kelas !== "Semua" ? query.kelas : null;
      const filterLevel =
        query.level && query.level !== "Semua" ? query.level : null;

      const allSetups = await db.select().from(elearningSetups).all();
      let filteredSetups = allSetups;
      if (filterKelas) {
        filteredSetups = allSetups.filter((s) => s.kelas === filterKelas);
      } else if (filterLevel) {
        filteredSetups = allSetups.filter(
          (s) => extractLevel(s.kelas) === parseInt(filterLevel),
        );
      }

      const tutorsList = await db.select().from(tutors).all();
      const allPosts = await db
        .select()
        .from(elearningForumPosts)
        .where(eq(elearningForumPosts.authorRole, "tutor"))
        .all();
      const allTutorAttendances = await db
        .select()
        .from(tutorAttendances)
        .all();
      const allCourses = await db.select().from(elearningCourses).all();
      const allSessions = await db.select().from(elearningSessions).all();

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Kelompokkan setup per mapel (gabung semua sub-rombel dalam satu level menjadi satu baris)
      const setupsByMapel = new Map<string, typeof filteredSetups>();
      for (const s of filteredSetups) {
        if (!setupsByMapel.has(s.mapel)) setupsByMapel.set(s.mapel, []);
        setupsByMapel.get(s.mapel)!.push(s);
      }

      const tutorsData: any[] = [];
      let rowNo = 0;
      for (const [mapel, group] of setupsByMapel) {
        const program = deriveProgram(group[0].kelas);
        const course = allCourses.find(
          (c) => c.namaMapel === mapel && c.program === program,
        );
        const courseSessions = course
          ? allSessions.filter((s) => s.courseId === course.id)
          : [];
        const sessionIds = new Set(courseSessions.map((s) => s.id));

        const tutorIds = new Set(group.map((g) => g.tutorId));
        // Gabung semua aktivitas tutor pada mapel ini (seluruh sub-rombel)
        const tutorPosts = allPosts.filter(
          (p) =>
            p.sessionId &&
            sessionIds.has(p.sessionId) &&
            tutorIds.has(p.authorId),
        );
        const tutorAtt = allTutorAttendances.filter((a) =>
          tutorIds.has(a.tutorId),
        );
        const allActivities = [...tutorPosts, ...tutorAtt];

        const { dayData, rekap } = buildAttendanceGrid(
          allActivities,
          (item) => item.date || item.createdAt,
          currentMonth,
          currentYear,
          daysInMonth,
        );

        const tutorNames = [
          ...new Set(
            group
              .map((g) => tutorsList.find((t) => t.id === g.tutorId)?.nama)
              .filter(Boolean),
          ),
        ];
        const namaTutor = tutorNames.length > 0 ? tutorNames.join(", ") : "-";

        // Label kelas berupa tingkat saja (gabung sub-rombel), mis. "PAKET C 10"
        const levelNum = extractLevel(group[0].kelas);
        const paket = levelNum <= 6 ? "A" : levelNum <= 9 ? "B" : "C";
        const kelasLabel = `PAKET ${paket} ${levelNum}`;

        tutorsData.push({
          no: ++rowNo,
          namaTutor,
          mapel,
          kelas: kelasLabel,
          ...dayData,
          rekap,
        });
      }

      // Derive program, semester from filtered setups
      const programCounts = new Map<string, number>();
      const semesterCounts = new Map<string, number>();
      for (const s of filteredSetups) {
        const prog = deriveProgram(s.kelas);
        programCounts.set(prog, (programCounts.get(prog) || 0) + 1);
        const sem = s.semester || "Ganjil";
        semesterCounts.set(sem, (semesterCounts.get(sem) || 0) + 1);
      }
      const program =
        [...programCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "Paket C";
      const semester =
        [...semesterCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "Ganjil";

      const kepalaPkbm = await db
        .select()
        .from(managers)
        .where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%"),
          ),
        )
        .get();
      const namaKepalaPkbm = kepalaPkbm?.nama || "-";
      const nipKepalaPkbm = kepalaPkbm?.nip || "-";

      // Ambil wali kelas dari rombel
      let namaWaliKelas = "-";
      let nipWaliKelas = "-";
      let waliKelasLabel = "-";
      if (filterKelas) {
        const rList = await db
          .select()
          .from(rombels)
          .where(eq(rombels.nama, filterKelas))
          .all();
        if (rList.length > 0 && rList[0].waliKelasId) {
          const wali = await db
            .select()
            .from(tutors)
            .where(eq(tutors.id, rList[0].waliKelasId))
            .get();
          namaWaliKelas = wali?.nama || "-";
          nipWaliKelas = wali?.nip || "-";
        }
        waliKelasLabel = filterKelas;
      } else {
        const rList = await db.select().from(rombels).all();
        const rWithWali = rList.find((r) => r.waliKelasId != null);
        if (rWithWali) {
          const wali = await db
            .select()
            .from(tutors)
            .where(eq(tutors.id, rWithWali.waliKelasId!))
            .get();
          namaWaliKelas = wali?.nama || "-";
          nipWaliKelas = wali?.nip || "-";
        }
        waliKelasLabel = "SEMUA KELAS";
      }

      // Label kelas untuk template
      const kelasLabel = filterKelas
        ? filterKelas.toUpperCase()
        : filterLevel
          ? `PAKET ${(() => {
              const n = parseInt(filterLevel);
              return n <= 6 ? "A" : n <= 9 ? "B" : "C";
            })()} ${filterLevel.toUpperCase()}`
          : "SEMUA KELAS";

      const buffer = fillTemplate(
        "DAFTAR HADIR TUTOR.xlsx",
        {
          program: program.toUpperCase(),
          semester: semester.toUpperCase(),
          tahunAjaran: getTahunAjaran(now),
          kelas: kelasLabel,
          bulan: now
            .toLocaleDateString("id-ID", { month: "long" })
            .toUpperCase(),
          waliKelas: namaWaliKelas.toUpperCase(),
          namaWaliKelas: namaWaliKelas.toUpperCase(),
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          kecamatan: "JATINAGARA",
          namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-",
          nipKepalaPkbm: nipKepalaPkbm,
          nipWaliKelas: nipWaliKelas,
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(),
          namaPemilik: "-",
          tutors: tutorsData.map((t) => ({
            ...t,
            namaTutor: t.namaTutor.toUpperCase(),
            mapel: t.mapel.toUpperCase(),
            kelas: t.kelas.toUpperCase(),
          })),
        },
        17,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="laporan_kehadiran_tutor_' +
          currentYear +
          "_" +
          (currentMonth + 1) +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // GET Laporan Kehadiran WB Per Mapel (xlsx template)
  .get("/laporan/student-attendance", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
      if (!setupId) {
        set.status = 400;
        return { success: false, message: "setupId diperlukan" };
      }

      const setup = await db
        .select()
        .from(elearningSetups)
        .where(eq(elearningSetups.id, setupId))
        .get();
      if (!setup) {
        set.status = 404;
        return { success: false, message: "Setup tidak ditemukan" };
      }

      const tutor = await db
        .select()
        .from(tutors)
        .where(eq(tutors.id, setup.tutorId))
        .get();
      const program = deriveProgram(setup.kelas);
      const course = await db
        .select()
        .from(elearningCourses)
        .where(
          and(
            eq(elearningCourses.namaMapel, setup.mapel),
            eq(elearningCourses.program, program),
          ),
        )
        .get();

      const rombelList = await db
        .select()
        .from(rombels)
        .where(eq(rombels.nama, setup.kelas))
        .all();
      const rombelIds = rombelList.map((r) => r.id);
      const studentsList =
        rombelIds.length > 0
          ? await db
              .select({
                id: students.id,
                nama: students.nama,
                nis: students.nis,
                nisn: students.nisn,
                jenisKelamin: students.jenisKelamin,
              })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];

      const sessionsList = course
        ? await db
            .select()
            .from(elearningSessions)
            .where(eq(elearningSessions.courseId, course.id))
            .all()
        : [];
      const sessionIds = sessionsList.map((s) => s.id);
      const attendances =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, sessionIds))
              .all()
          : [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const sessionDates = new Set<number>();
      sessionsList.forEach((s) => {
        if (s.startDate) {
          const dt = new Date(s.startDate);
          if (
            dt.getMonth() === currentMonth &&
            dt.getFullYear() === currentYear
          ) {
            sessionDates.add(dt.getDate());
          }
        }
      });

      const siswaData = studentsList.map((student, idx) => {
        const studentAtt = attendances.filter(
          (a) => a.studentId === student.id,
        );
        const { dayData, rekap } = buildAttendanceGrid(
          studentAtt,
          (a) => a.attendedAt || a.createdAt,
          currentMonth,
          currentYear,
          daysInMonth,
          sessionDates,
        );
        return {
          no: idx + 1,
          nis: student.nis || "",
          nisn: student.nisn || "",
          namaSiswa: student.nama,
          jenisKelamin: student.jenisKelamin || "",
          rombel: setup.kelas,
          ...dayData,
          rekap,
        };
      });

      const buffer = fillTemplate(
        "DAFTAR HADIR WARGA BELAJAR PER MAPEL.xlsx",
        {
          program: program.toUpperCase(),
          semester: (setup.semester || "Ganjil").toUpperCase(),
          tahunAjaran: getTahunAjaran(now),
          mapel: setup.mapel.toUpperCase(),
          kelas: setup.kelas.toUpperCase(),
          namaTutor: (tutor?.nama || "-").toUpperCase(),
          bulan: now
            .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
            .toUpperCase(),
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          nipTutor: tutor?.nip || "-",
          siswa: siswaData.map((s) => ({
            ...s,
            namaSiswa: s.namaSiswa.toUpperCase(),
            jenisKelamin: s.jenisKelamin.toUpperCase(),
            rombel: s.rombel.toUpperCase(),
          })),
        },
        17,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="kehadiran_wb_' +
          sanitizeFilename(setup.mapel) +
          "_" +
          currentYear +
          "_" +
          (currentMonth + 1) +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // GET Laporan Kehadiran WB Rekap (xlsx template)
  .get("/laporan/student-attendance-rekap", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const filterKelas =
        query.kelas && query.kelas !== "Semua" ? query.kelas : null;
      const filterLevel =
        query.level && query.level !== "Semua" ? query.level : null;

      // Cari rombel berdasarkan filter (urutkan alfabetis agar PAKET B 9 didahulukan sebelum PAKET B 9 A)
      const allRombels = (await db.select().from(rombels).all()).sort((a, b) =>
        a.nama.localeCompare(b.nama, undefined, { numeric: true }),
      );
      let rombelList: typeof allRombels;
      if (filterKelas) {
        rombelList = allRombels.filter((r) => r.nama === filterKelas);
      } else if (filterLevel) {
        rombelList = allRombels.filter(
          (r) => extractLevel(r.nama) === parseInt(filterLevel),
        );
      } else {
        rombelList = allRombels;
      }

      const rombelIds = rombelList.map((r) => r.id);
      const studentsListRaw =
        rombelIds.length > 0
          ? await db
              .select({
                id: students.id,
                nama: students.nama,
                nis: students.nis,
                nisn: students.nisn,
                jenisKelamin: students.jenisKelamin,
              })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];
      const studentsList = studentsListRaw.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
      );

      const setups = filterKelas
        ? await db
            .select()
            .from(elearningSetups)
            .where(eq(elearningSetups.kelas, filterKelas))
            .all()
        : await db.select().from(elearningSetups).all();
      const filteredSetups =
        filterLevel && !filterKelas
          ? setups.filter(
              (s) => extractLevel(s.kelas) === parseInt(filterLevel),
            )
          : setups;
      if (filteredSetups.length === 0) {
        set.status = 404;
        return {
          success: false,
          message: "Tidak ditemukan setup elearning untuk kelas tersebut",
        };
      }
      // Batch course lookup using Drizzle or()
      const courseConditions = filteredSetups.map((s) =>
        and(
          eq(elearningCourses.namaMapel, s.mapel),
          eq(elearningCourses.program, deriveProgram(s.kelas)),
        ),
      );
      const allCourses =
        courseConditions.length > 0
          ? await db
              .select()
              .from(elearningCourses)
              .where(
                courseConditions.length === 1
                  ? courseConditions[0]
                  : or(...courseConditions),
              )
              .all()
          : [];
      const courseIds: number[] = [];
      for (const s of filteredSetups) {
        const prog = deriveProgram(s.kelas);
        const c = allCourses.find(
          (c) => c.namaMapel === s.mapel && c.program === prog,
        );
        if (c) courseIds.push(c.id);
      }
      const allSessions =
        courseIds.length > 0
          ? await db
              .select()
              .from(elearningSessions)
              .where(inArray(elearningSessions.courseId, courseIds))
              .all()
          : [];
      const sessionIds = allSessions.map((s) => s.id);
      const allAttendances =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, sessionIds))
              .all()
          : [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const sessionDates = new Set<number>();
      allSessions.forEach((s) => {
        if (s.startDate) {
          const dt = new Date(s.startDate);
          if (
            dt.getMonth() === currentMonth &&
            dt.getFullYear() === currentYear
          ) {
            sessionDates.add(dt.getDate());
          }
        }
      });

      const rombelWithWali = rombelList.find((r) => r.waliKelasId != null);
      const waliKelasObj = rombelWithWali
        ? await db
            .select()
            .from(tutors)
            .where(eq(tutors.id, rombelWithWali.waliKelasId!))
            .get()
        : null;
      const waliKelas = waliKelasObj?.nama || "-";
      const nipWaliKelas = waliKelasObj?.nip || "-";

      // Label kelas untuk template (declared before usage)
      const kelasLabel = filterKelas
        ? filterKelas.toUpperCase()
        : filterLevel
          ? `PAKET ${(() => {
              const n = parseInt(filterLevel);
              return n <= 6 ? "A" : n <= 9 ? "B" : "C";
            })()} ${filterLevel.toUpperCase()}`
          : "SEMUA KELAS";

      const siswaData = studentsList.map((student, idx) => {
        const studentAtt = allAttendances.filter(
          (a) => a.studentId === student.id,
        );
        const { dayData, rekap } = buildAttendanceGrid(
          studentAtt,
          (a) => a.attendedAt || a.createdAt,
          currentMonth,
          currentYear,
          daysInMonth,
          sessionDates,
        );
        return {
          no: idx + 1,
          nis: student.nis || "",
          nisn: student.nisn || "",
          namaSiswa: student.nama,
          jenisKelamin: student.jenisKelamin || "",
          rombel: kelasLabel,
          ...dayData,
          rekap,
        };
      });

      const program =
        filteredSetups.length > 0
          ? deriveProgram(filteredSetups[0].kelas).toUpperCase()
          : "PAKET A/B/C";

      const kepalaPkbm = await db
        .select()
        .from(managers)
        .where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%"),
          ),
        )
        .get();
      const namaKepalaPkbm = kepalaPkbm?.nama || "-";
      const nipKepalaPkbm = kepalaPkbm?.nip || "-";

      const buffer = fillTemplate(
        "DAFTAR HADIR WARGA BELAJAR REKAP.xlsx",
        {
          program,
          semester: (filteredSetups[0].semester || "Ganjil").toUpperCase(),
          tahunAjaran: getTahunAjaran(now),
          kelas: kelasLabel,
          waliKelas: waliKelas.toUpperCase(),
          namaWaliKelas: waliKelas.toUpperCase(),
          bulan: now
            .toLocaleDateString("id-ID", { month: "long" })
            .toUpperCase(),
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          kecamatan: "JATINAGARA",
          namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-",
          nipKepalaPkbm: nipKepalaPkbm,
          nipWaliKelas: nipWaliKelas,
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(),
          namaPemilik: "-",
          siswa: siswaData.map((s) => ({
            ...s,
            namaSiswa: s.namaSiswa.toUpperCase(),
            jenisKelamin: s.jenisKelamin.toUpperCase(),
            rombel: s.rombel.toUpperCase(),
          })),
        },
        17,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="rekap_kehadiran_wb_' +
          sanitizeFilename(kelasLabel) +
          "_" +
          currentYear +
          "_" +
          (currentMonth + 1) +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // GET Laporan Kehadiran WB Per Mapel (JSON)
  .get("/laporan/student-attendances", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
      if (!setupId) {
        set.status = 400;
        return { success: false, message: "setupId diperlukan" };
      }

      const setup = await db
        .select()
        .from(elearningSetups)
        .where(eq(elearningSetups.id, setupId))
        .get();
      if (!setup) {
        set.status = 404;
        return { success: false, message: "Setup tidak ditemukan" };
      }

      const program = deriveProgram(setup.kelas);
      const course = await db
        .select()
        .from(elearningCourses)
        .where(
          and(
            eq(elearningCourses.namaMapel, setup.mapel),
            eq(elearningCourses.program, program),
          ),
        )
        .get();

      const rombelList = await db
        .select()
        .from(rombels)
        .where(eq(rombels.nama, setup.kelas))
        .all();
      const rombelIds = rombelList.map((r) => r.id);
      const studentsList =
        rombelIds.length > 0
          ? await db
              .select({
                id: students.id,
                nama: students.nama,
                nis: students.nis,
              })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];

      const sessionsList = course
        ? await db
            .select()
            .from(elearningSessions)
            .where(eq(elearningSessions.courseId, course.id))
            .all()
        : [];
      const sessionIds = sessionsList.map((s) => s.id);
      const attendances =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, sessionIds))
              .all()
          : [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const sessionDates = new Set<number>();
      sessionsList.forEach((s) => {
        if (s.startDate) {
          const dt = new Date(s.startDate);
          if (
            dt.getMonth() === currentMonth &&
            dt.getFullYear() === currentYear
          ) {
            sessionDates.add(dt.getDate());
          }
        }
      });

      const siswaData = studentsList.map((student) => {
        const studentAtt = attendances.filter(
          (a) => a.studentId === student.id,
        );
        const { dayData, rekap } = buildAttendanceGrid(
          studentAtt,
          (a) => a.attendedAt || a.createdAt,
          currentMonth,
          currentYear,
          daysInMonth,
          sessionDates,
        );
        return {
          nis: student.nis || "",
          namaSiswa: student.nama,
          rombel: setup.kelas,
          ...dayData,
          rekap,
        };
      });

      return {
        success: true,
        data: siswaData,
        daysInMonth,
        month: currentMonth,
        year: currentYear,
      };
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // GET Laporan Nilai WB Per Mapel (JSON)
  .get("/laporan/student-grades", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
      if (!setupId) {
        set.status = 400;
        return { success: false, message: "setupId diperlukan" };
      }

      const setup = await db
        .select()
        .from(elearningSetups)
        .where(eq(elearningSetups.id, setupId))
        .get();
      if (!setup) {
        set.status = 404;
        return { success: false, message: "Setup tidak ditemukan" };
      }

      const tutor = await db
        .select()
        .from(tutors)
        .where(eq(tutors.id, setup.tutorId))
        .get();
      const program = deriveProgram(setup.kelas);
      const course = await db
        .select()
        .from(elearningCourses)
        .where(
          and(
            eq(elearningCourses.namaMapel, setup.mapel),
            eq(elearningCourses.program, program),
          ),
        )
        .get();

      const rombelList = await db
        .select()
        .from(rombels)
        .where(eq(rombels.nama, setup.kelas))
        .all();
      const rombelIds = rombelList.map((r) => r.id);
      const studentsList =
        rombelIds.length > 0
          ? await db
              .select({
                id: students.id,
                nama: students.nama,
                nis: students.nis,
                nisn: students.nisn,
                jenisKelamin: students.jenisKelamin,
              })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];

      const courseId = course ? course.id : null;
      const defaultSessions =
        setup.jumlahSesi && setup.jumlahSesi > 0 ? setup.jumlahSesi : 8;

      let allSessionIds: number[] = [];
      let allAttendances: any[] = [];
      let allForumPosts: any[] = [];
      let allSubmissions: any[] = [];

      if (courseId) {
        const sessions = await db
          .select()
          .from(elearningSessions)
          .where(eq(elearningSessions.courseId, courseId))
          .all();
        const realSessions = sessions.filter((s) => s.sessionNumber >= 1);
        allSessionIds = realSessions.map((s) => s.id);
        if (allSessionIds.length > 0) {
          allAttendances = await db
            .select()
            .from(elearningAttendances)
            .where(inArray(elearningAttendances.sessionId, allSessionIds))
            .all();
          allForumPosts = await db
            .select()
            .from(elearningForumPosts)
            .where(
              and(
                eq(elearningForumPosts.courseId, courseId),
                eq(elearningForumPosts.authorRole, "siswa"),
                inArray(elearningForumPosts.sessionId, allSessionIds),
              ),
            )
            .all();
          const assignments = await db
            .select()
            .from(elearningAssignments)
            .where(inArray(elearningAssignments.sessionId, allSessionIds))
            .all();
          const assignmentIds = assignments.map((a) => a.id);
          if (assignmentIds.length > 0) {
            allSubmissions = await db
              .select()
              .from(elearningSubmissions)
              .where(inArray(elearningSubmissions.assignmentId, assignmentIds))
              .all();
          }
        }
      }

      const now = new Date();
      const currentYear = now.getFullYear();

      const siswaData = studentsList.map((student, idx) => {
        const sessionsCount =
          allSessionIds.length > 0 ? allSessionIds.length : defaultSessions;
        const attendedSessions = new Set(
          allAttendances
            .filter((a) => a.studentId === student.id)
            .map((a) => a.sessionId),
        );
        const participatedSessions = new Set(
          allForumPosts
            .filter((p) => p.authorId === student.id)
            .map((p) => p.sessionId),
        );
        const studentSubs = allSubmissions.filter(
          (s) => s.studentId === student.id,
        );
        const studentGrades = studentSubs
          .filter((s) => s.grade != null)
          .map((s) => s.grade as number);

        const kehadiran = Math.min(
          100,
          Math.round((attendedSessions.size / sessionsCount) * 100),
        );
        const partisipasi = Math.min(
          100,
          Math.round((participatedSessions.size / sessionsCount) * 100),
        );
        const tugas =
          studentGrades.length > 0
            ? Math.min(
                100,
                Math.round(
                  studentGrades.reduce((a, b) => a + b, 0) /
                    studentGrades.length,
                ),
              )
            : 0;
        const { final, predikat } = calculateGrade(
          kehadiran,
          partisipasi,
          tugas,
        );

        return {
          no: idx + 1,
          nis: student.nis || "",
          nisn: student.nisn || "",
          namaSiswa: student.nama,
          jenisKelamin: student.jenisKelamin || "",
          rombel: setup.kelas,
          nilaiTugas: tugas,
          nilaiDiskusi: partisipasi,
          nilaiKehadiran: kehadiran,
          nilaiAkhir: final,
          predikat,
        };
      });

      const buffer = fillTemplate(
        "NILAI WARGA BELAJAR PER MAPEL.xlsx",
        {
          program: program.toUpperCase(),
          semester: (setup.semester || "Ganjil").toUpperCase(),
          tahunAjaran: getTahunAjaran(now),
          mapel: setup.mapel.toUpperCase(),
          kelas: setup.kelas.toUpperCase(),
          namaTutor: (tutor?.nama || "-").toUpperCase(),
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          nipTutor: tutor?.nip || "-",
          siswa: siswaData.map((s) => ({
            ...s,
            namaSiswa: s.namaSiswa.toUpperCase(),
            jenisKelamin: s.jenisKelamin.toUpperCase(),
            rombel: s.rombel.toUpperCase(),
          })),
        },
        17,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="nilai_wb_' +
          sanitizeFilename(setup.mapel) +
          "_" +
          currentYear +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // GET Laporan Nilai WB Rekap (xlsx template)
  .get("/laporan/student-grades-rekap", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const filterKelas =
        query.kelas && query.kelas !== "Semua" ? query.kelas : null;
      const filterLevel =
        query.level && query.level !== "Semua" ? query.level : null;

      let setupsFilter: any = undefined;
      let kelasName = "SEMUA KELAS";
      if (filterKelas) {
        setupsFilter = eq(elearningSetups.kelas, filterKelas);
        kelasName = filterKelas.toUpperCase();
      } else if (filterLevel) {
        // Level filter - will filter after query
        kelasName = `PAKET ${(() => {
          const n = parseInt(filterLevel);
          return n <= 6 ? "A" : n <= 9 ? "B" : "C";
        })()} ${filterLevel.toUpperCase()}`;
      }

      const setups = await db
        .select()
        .from(elearningSetups)
        .where(setupsFilter)
        .all();
      const filteredSetups =
        filterLevel && !filterKelas
          ? setups.filter(
              (s) => extractLevel(s.kelas) === parseInt(filterLevel),
            )
          : setups;
      if (filteredSetups.length === 0) {
        set.status = 404;
        return { success: false, message: "Tidak ditemukan setup elearning" };
      }

      // Get unique courses from setups to know how many mapels
      const mapelNames = [
        ...new Set(filteredSetups.map((s) => s.mapel)),
      ].sort();

      // Get all classes
      const allKelas = [...new Set(filteredSetups.map((s) => s.kelas))];
      const rombelList = await db
        .select()
        .from(rombels)
        .where(inArray(rombels.nama, allKelas))
        .all();
      const rombelIds = rombelList.map((r) => r.id);
      const studentsListRaw =
        rombelIds.length > 0
          ? await db
              .select({
                id: students.id,
                nama: students.nama,
                nis: students.nis,
                nisn: students.nisn,
                jenisKelamin: students.jenisKelamin,
                kelas: rombels.nama,
              })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .innerJoin(rombels, eq(rombels.id, rombelStudents.rombelId))
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];
      const studentsList = studentsListRaw.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
      );

      // Pre-fetch courses, sessions, attendances, forum posts, submissions
      const courseConditions = filteredSetups.map((s) =>
        and(
          eq(elearningCourses.namaMapel, s.mapel),
          eq(elearningCourses.program, deriveProgram(s.kelas)),
        ),
      );
      const allCourses =
        courseConditions.length > 0
          ? await db
              .select()
              .from(elearningCourses)
              .where(
                courseConditions.length === 1
                  ? courseConditions[0]
                  : or(...courseConditions),
              )
              .all()
          : [];
      const courseIds = allCourses.map((c) => c.id);

      const allSessions =
        courseIds.length > 0
          ? await db
              .select()
              .from(elearningSessions)
              .where(inArray(elearningSessions.courseId, courseIds))
              .all()
          : [];
      const sessionIds = allSessions.map((s) => s.id);

      const allAttendances =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, sessionIds))
              .all()
          : [];
      const allForumPosts =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningForumPosts)
              .where(
                and(
                  inArray(elearningForumPosts.sessionId, sessionIds),
                  eq(elearningForumPosts.authorRole, "siswa"),
                ),
              )
              .all()
          : [];
      const assignments =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAssignments)
              .where(inArray(elearningAssignments.sessionId, sessionIds))
              .all()
          : [];
      const assignmentIds = assignments.map((a) => a.id);
      const allSubmissions =
        assignmentIds.length > 0
          ? await db
              .select()
              .from(elearningSubmissions)
              .where(inArray(elearningSubmissions.assignmentId, assignmentIds))
              .all()
          : [];

      const now = new Date();
      const currentYear = now.getFullYear();

      // Optimizations: Map-based caching
      const setupsMap = new Map();
      for (const s of filteredSetups) setupsMap.set(`${s.kelas}-${s.mapel}`, s);

      const courseMap = new Map();
      for (const c of allCourses)
        courseMap.set(`${c.namaMapel}-${c.program}`, c);

      const sessionsByCourse = new Map<number, typeof allSessions>();
      for (const s of allSessions) {
        if (!sessionsByCourse.has(s.courseId))
          sessionsByCourse.set(s.courseId, []);
        sessionsByCourse.get(s.courseId)!.push(s);
      }

      const attendancesByStudentSession = new Set();
      for (const a of allAttendances)
        attendancesByStudentSession.add(`${a.studentId}-${a.sessionId}`);

      const forumPostsByStudentSession = new Set();
      for (const p of allForumPosts)
        forumPostsByStudentSession.add(`${p.authorId}-${p.sessionId}`);

      const assignmentsBySession = new Map<number, number[]>();
      for (const a of assignments) {
        if (!assignmentsBySession.has(a.sessionId))
          assignmentsBySession.set(a.sessionId, []);
        assignmentsBySession.get(a.sessionId)!.push(a.id);
      }

      const submissionsByStudentAssignment = new Map<string, number>();
      for (const s of allSubmissions) {
        if (s.grade != null)
          submissionsByStudentAssignment.set(
            `${s.studentId}-${s.assignmentId}`,
            s.grade as number,
          );
      }

      const siswaData = studentsList.map((student, idx) => {
        const sData: any = {
          no: idx + 1,
          nis: student.nis || "",
          nisn: student.nisn || "",
          namaSiswa: student.nama,
          jenisKelamin: student.jenisKelamin || "",
          rombel: student.kelas,
        };

        mapelNames.forEach((mapelName, mIdx) => {
          const mKey = `mapel${mIdx + 1}`;
          sData[mKey] = mapelName.toUpperCase(); // contains the mapel name

          const setup = setupsMap.get(`${student.kelas}-${mapelName}`);
          if (!setup) {
            sData[`${mKey}Nilai`] = "-";
            sData[`${mKey}Predikat`] = "-";
            return;
          }

          const prog = deriveProgram(setup.kelas);
          const course = courseMap.get(`${mapelName}-${prog}`);
          if (!course) {
            sData[`${mKey}Nilai`] = "-";
            sData[`${mKey}Predikat`] = "-";
            return;
          }

          const sessions = sessionsByCourse.get(course.id) || [];
          const sIds = sessions.map((s) => s.id);
          const sessionsCount =
            sIds.length > 0 ? sIds.length : setup.jumlahSesi || 8;

          let attendedCount = 0;
          let participatedCount = 0;
          const studentGrades: number[] = [];

          for (const sId of sIds) {
            if (attendancesByStudentSession.has(`${student.id}-${sId}`))
              attendedCount++;
            if (forumPostsByStudentSession.has(`${student.id}-${sId}`))
              participatedCount++;
            const assignIds = assignmentsBySession.get(sId) || [];
            for (const aId of assignIds) {
              const grade = submissionsByStudentAssignment.get(
                `${student.id}-${aId}`,
              );
              if (grade !== undefined) studentGrades.push(grade);
            }
          }

          const kehadiran = Math.min(
            100,
            Math.round((attendedCount / sessionsCount) * 100),
          );
          const partisipasi = Math.min(
            100,
            Math.round((participatedCount / sessionsCount) * 100),
          );
          const tugas =
            studentGrades.length > 0
              ? Math.min(
                  100,
                  Math.round(
                    studentGrades.reduce((a, b) => a + b, 0) /
                      studentGrades.length,
                  ),
                )
              : 0;
          const { final, predikat } = calculateGrade(
            kehadiran,
            partisipasi,
            tugas,
          );

          sData[`${mKey}Nilai`] = final;
          sData[`${mKey}Predikat`] = predikat;
        });

        return sData;
      });

      const program =
        filteredSetups.length > 0
          ? deriveProgram(filteredSetups[0].kelas).toUpperCase()
          : "PAKET A/B/C";
      const semester =
        filteredSetups.length > 0
          ? (filteredSetups[0].semester || "Ganjil").toUpperCase()
          : "GANJIL";

      const rombelForWali = (
        filterKelas
          ? rombelList.filter((r) => r.nama === filterKelas)
          : filterLevel
            ? rombelList.filter(
                (r) => extractLevel(r.nama) === parseInt(filterLevel),
              )
            : rombelList
      ).sort((a, b) =>
        a.nama.localeCompare(b.nama, undefined, { numeric: true }),
      );
      const rombelWithWali = rombelForWali.find((r) => r.waliKelasId != null);
      const waliKelasObj = rombelWithWali
        ? await db
            .select()
            .from(tutors)
            .where(eq(tutors.id, rombelWithWali.waliKelasId!))
            .get()
        : null;
      const waliKelasNama = waliKelasObj?.nama || "-";
      const nipWaliKelas = waliKelasObj?.nip || "-";

      const kepalaPkbm = await db
        .select()
        .from(managers)
        .where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%"),
          ),
        )
        .get();
      const namaKepalaPkbm = kepalaPkbm?.nama || "-";
      const nipKepalaPkbm = kepalaPkbm?.nip || "-";

      const buffer = fillTemplate(
        "NILAI WARGA BELAJAR REKAP.xlsx",
        {
          program,
          semester,
          tahunAjaran: getTahunAjaran(now),
          kelas: kelasName,
          kelas2: kelasName,
          waliKelas: waliKelasNama.toUpperCase(),
          namaWaliKelas: waliKelasNama.toUpperCase(),
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          kecamatan: "JATINAGARA",
          namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-",
          nipKepalaPkbm: nipKepalaPkbm,
          nipWaliKelas: nipWaliKelas,
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(),
          namaPemilik: "-",
          siswa: siswaData.map((s) => ({
            ...s,
            namaSiswa: s.namaSiswa.toUpperCase(),
            jenisKelamin: s.jenisKelamin.toUpperCase(),
            rombel: s.rombel.toUpperCase(),
          })),
        },
        18,
        mapelNames.length,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="rekap_nilai_wb_' +
          sanitizeFilename(kelasName) +
          "_" +
          currentYear +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      console.error("Export error:", error);
      set.status = 500;
      return {
        success: false,
        message: "Terjadi kesalahan saat meng-export data.",
      };
    }
  }) // GET Laporan Agenda Tutor Per Mapel (xlsx template)

  .get("/laporan/tutor-agenda", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
      if (!setupId) {
        set.status = 400;
        return { success: false, message: "setupId diperlukan" };
      }

      const setup = await db
        .select()
        .from(elearningSetups)
        .where(eq(elearningSetups.id, setupId))
        .get();
      if (!setup) {
        set.status = 404;
        return { success: false, message: "Setup tidak ditemukan" };
      }

      const tutor = await db
        .select()
        .from(tutors)
        .where(eq(tutors.id, setup.tutorId))
        .get();
      const program = deriveProgram(setup.kelas);
      const course = await db
        .select()
        .from(elearningCourses)
        .where(
          and(
            eq(elearningCourses.namaMapel, setup.mapel),
            eq(elearningCourses.program, program),
          ),
        )
        .get();

      // Daftar warga belajar di kelas (untuk hitung kehadiran per sesi)
      const rombelList = await db
        .select()
        .from(rombels)
        .where(eq(rombels.nama, setup.kelas))
        .all();
      const rombelIds = rombelList.map((r) => r.id);
      const studentsList =
        rombelIds.length > 0
          ? await db
              .select({ id: students.id, nama: students.nama })
              .from(students)
              .innerJoin(
                rombelStudents,
                eq(students.id, rombelStudents.studentId),
              )
              .where(inArray(rombelStudents.rombelId, rombelIds))
              .all()
          : [];
      const totalStudents = studentsList.length;

      // Sesi pada course, urut berdasarkan nomor sesi (abaikan sesi 0 / pendahuluan)
      const sessionsList = course
        ? (
            await db
              .select()
              .from(elearningSessions)
              .where(eq(elearningSessions.courseId, course.id))
              .all()
          ).filter((s) => (s.sessionNumber ?? 0) > 0)
        : [];
      sessionsList.sort(
        (a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0),
      );
      const sessionIds = sessionsList.map((s) => s.id);

      // Materi per sesi
      const materialsList =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningMaterials)
              .where(inArray(elearningMaterials.sessionId, sessionIds))
              .all()
          : [];

      // Kehadiran per sesi
      const attendances =
        sessionIds.length > 0
          ? await db
              .select()
              .from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, sessionIds))
              .all()
          : [];

      const agendaData = sessionsList.map((s, idx) => {
        const sessMaterials = materialsList.filter((m) => m.sessionId === s.id);
        const materiList = sessMaterials
          .map((m) => m.title)
          .map(stripHtml)
          .filter(Boolean);
        // Materi diambil dari isian "Materi yang diajarkan" tutor (description); fallback ke judul materi unggah; selain itu "-"
        const materi = stripHtml(s.description) || materiList.join(", ") || "-";
        const attendedIds = new Set(
          attendances
            .filter((a) => a.sessionId === s.id)
            .map((a) => a.studentId),
        );
        const hadir = attendedIds.size;
        const tidakHadir = Math.max(0, totalStudents - hadir);
        const absentNames = studentsList
          .filter((st) => !attendedIds.has(st.id))
          .map((st) => st.nama);
        const keterangan = tidakHadir > 0 ? absentNames.join(", ") : "-";
        // Hari, Tanggal otomatis terisi tanggal terakhir sesi di-Simpan (updated_at) saat tutor simpan materi/tujuan/uraian; "-" jika belum ada isian
        const adaIsian = Boolean(
          stripHtml(s.description) ||
          stripHtml(s.tujuanPembelajaran) ||
          stripHtml(s.uraianKegiatan),
        );
        const hariTanggal =
          adaIsian && s.updatedAt
            ? new Date(s.updatedAt).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "-";
        return {
          no: idx + 1,
          hariTanggal,
          sesi: s.sessionNumber || idx + 1,
          materi: materi || "-",
          tujuan: stripHtml(s.tujuanPembelajaran) || "-",
          uraian: stripHtml(s.uraianKegiatan) || "-",
          hadir,
          tidakHadir,
          keterangan,
        };
      });

      const now = new Date();
      const currentYear = now.getFullYear();

      const buffer = fillTemplate(
        "DAFTAR AGENDA TUTOR.xlsx",
        {
          program: program.toUpperCase(),
          semester: (setup.semester || "Ganjil").toUpperCase(),
          tahunAjaran: getTahunAjaran(now),
          mapel: setup.mapel.toUpperCase(),
          kelas: setup.kelas.toUpperCase(),
          namaTutor: (tutor?.nama || "-").toUpperCase(),
          nipTutor: tutor?.nip || "-",
          tanggalCetak: now
            .toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .toUpperCase(),
          agenda: agendaData.map((a) => ({
            ...a,
            materi: String(a.materi).toUpperCase(),
            tujuan: String(a.tujuan).toUpperCase(),
            uraian: String(a.uraian).toUpperCase(),
            hariTanggal: String(a.hariTanggal).toUpperCase(),
            keterangan: String(a.keterangan).toUpperCase(),
          })),
        },
        17,
      );

      set.headers = {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="agenda_tutor_' +
          sanitizeFilename(setup.mapel) +
          "_" +
          currentYear +
          '.xlsx"',
      };
      return buffer;
    } catch (error: any) {
      set.status = 500;
      console.error("Laporan error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  });
