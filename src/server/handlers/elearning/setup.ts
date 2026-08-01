// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../../config/db";
import { eq, and, or, inArray, isNull, like, desc, asc, sql } from "drizzle-orm";
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
  elearningSessionAngkets
} from "../../models";
import { verifyAdmin, verifyAdminOrTutor } from "../../middleware/auth";
import { verifyUser, sanitizeFilename, deriveProgram, buildAttendanceGrid, calculateGrade } from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";

  // ==========================================
  // ELEARNING SETUPS
  // ==========================================

  // GET all setups (admin) or filtered by tutorId (tutor) or kelas (siswa)
export const setupHandlers = new Elysia()
  .get(
    "/setups",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const conditions: any[] = [];
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (payload.role === "tutor") {
          conditions.push(eq(elearningSetups.tutorId, payload.id as number));
        } else if (payload.role === "siswa" && query.kelas) {
          conditions.push(eq(elearningSetups.kelas, query.kelas));
        } else if (query.tutorId) {
          conditions.push(eq(elearningSetups.tutorId, parseInt(query.tutorId)));
        } else if (query.kelas) {
          conditions.push(eq(elearningSetups.kelas, query.kelas));
        }

        // Filter by semester if provided
        if (query.semester) {
          conditions.push(eq(elearningSetups.semester, query.semester));
        }

        const condition = conditions.length > 0 ? and(...conditions) : undefined;

        const setups = await db
          .select()
          .from(elearningSetups)
          .where(condition)
          .all();

        return { success: true, data: setups };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      query: t.Object({
        tutorId: t.Optional(t.String()),
        kelas: t.Optional(t.String()),
        semester: t.Optional(t.String()),
      }),
    }
  )

  // POST new setup (admin only)
  .post(
    "/setups",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { kelas, mapel, tutorId, skk, jumlahSesi, semester } = body;
        const inserted = await db
          .insert(elearningSetups)
          .values({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
            semester: semester || "Ganjil",
          })
          .returning();

        return { success: true, data: inserted[0] };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        kelas: t.String(),
        mapel: t.String(),
        tutorId: t.Number(),
        skk: t.Number(),
        jumlahSesi: t.Number(),
        semester: t.Optional(t.String()),
      }),
    }
  )

  // POST copy seluruh setup dari semester lain (admin only)
  .post(
    "/setups/copy",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { fromSemester, toSemester } = body;
        if (!fromSemester || !toSemester) {
          set.status = 400;
          return { success: false, message: "Semester sumber dan tujuan wajib diisi" };
        }
        if (fromSemester === toSemester) {
          set.status = 400;
          return { success: false, message: "Semester sumber dan tujuan tidak boleh sama" };
        }

        const sourceSetups = await db
          .select()
          .from(elearningSetups)
          .where(eq(elearningSetups.semester, fromSemester))
          .all();

        if (sourceSetups.length === 0) {
          return { success: true, copied: 0, skipped: 0, message: `Tidak ada setup di semester ${fromSemester} untuk disalin` };
        }

        const targetSetups = await db
          .select()
          .from(elearningSetups)
          .where(eq(elearningSetups.semester, toSemester))
          .all();
        const existingKeys = new Set(targetSetups.map((s) => `${s.kelas}|||${s.mapel}`));

        let copied = 0;
        let skipped = 0;
        for (const s of sourceSetups) {
          const key = `${s.kelas}|||${s.mapel}`;
          if (existingKeys.has(key)) {
            skipped++;
            continue;
          }
          await db.insert(elearningSetups).values({
            kelas: s.kelas,
            mapel: s.mapel,
            tutorId: s.tutorId,
            skk: s.skk,
            jumlahSesi: s.jumlahSesi,
            semester: toSemester,
          });
          copied++;
        }

        return {
          success: true,
          copied,
          skipped,
          message: `Berhasil menyalin ${copied} setup dari semester ${fromSemester} ke ${toSemester}${skipped > 0 ? `, ${skipped} dilewati (sudah ada)` : ""}`,
        };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup copy error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        fromSemester: t.String(),
        toSemester: t.String(),
      }),
    }
  )

  // PUT update setup (admin only)
  .put(
    "/setups/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { kelas, mapel, tutorId, skk, jumlahSesi, semester } = body;
        const updated = await db
          .update(elearningSetups)
          .set({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
            semester: semester || "Ganjil",
          })
          .where(eq(elearningSetups.id, parseInt(id)))
          .returning();

        if (updated.length === 0) {
          set.status = 404;
          return { success: false, message: "Setup tidak ditemukan" };
        }

        return { success: true, data: updated[0] };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        kelas: t.String(),
        mapel: t.String(),
        tutorId: t.Number(),
        skk: t.Number(),
        jumlahSesi: t.Number(),
        semester: t.Optional(t.String()),
      }),
    }
  )

  // DELETE setup (admin only)
  .delete(
    "/setups/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        await db.delete(elearningSetups).where(eq(elearningSetups.id, parseInt(id)));
        return { success: true, message: "Berhasil menghapus setup" };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

  // ==========================================
  // NEW ENDPOINTS FOR REFACTORING
  // ==========================================

  // Toggle session isOpen (admin only)
  .put(
    "/session/:id/toggle",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        await db
          .update(elearningSessions)
          .set({ isOpen: body.isOpen })
          .where(eq(elearningSessions.id, parseInt(id)));
        return { success: true, message: "Status sesi berhasil diubah" };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        isOpen: t.Boolean(),
      }),
    }
  )

  // GET setups by student (dinamis berdasarkan rombel siswa)
  .get(
    "/setups/by-student/:studentId",
    async (context: any) => {
      const { headers, jwt, params: { studentId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        let finalStudentId = parseInt(studentId);
        if (payload && payload.role === "siswa") {
          finalStudentId = payload.id as number;
        }

        // Cari siswa
        const student = await db.select().from(students).where(eq(students.id, finalStudentId)).get();
        if (!student) return { success: false, message: "Siswa tidak ditemukan" };

        // Cari rombel siswa
        const rombelRel = await db.select().from(rombelStudents).where(eq(rombelStudents.studentId, student.id)).get();
        if (!rombelRel) return { success: true, data: [] }; // belum masuk rombel

        const rombel = await db.select().from(rombels).where(eq(rombels.id, rombelRel.rombelId)).get();
        if (!rombel) return { success: true, data: [] };

        // Ambil setup berdasarkan kelas rombel
        const setups = await db
          .select({
            setup: elearningSetups,
            tutorName: tutors.nama,
          })
          .from(elearningSetups)
          .leftJoin(tutors, eq(elearningSetups.tutorId, tutors.id))
          .where(eq(elearningSetups.kelas, rombel.nama))
          .all();

        return { success: true, data: setups };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

  // GET students by setup (untuk tutor melihat murid di kelasnya)
  .get(
    "/students-by-setup/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, parseInt(setupId))).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        const rombelList = await db.select().from(rombels).where(eq(rombels.nama, setup.kelas)).all();
        if (rombelList.length === 0) return { success: true, data: [] };
        const rombelIds = rombelList.map((r) => r.id);

        const studentsInRombel = await db
          .select({
            id: students.id,
            nama: students.nama,
            nis: students.nis,
          })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds))
          .all();

        return { success: true, data: studentsInRombel };
      } catch (error: any) {
        set.status = 500;
        console.error("Setup error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

;
