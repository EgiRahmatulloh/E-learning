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
import sanitizeHtml from "sanitize-html";
import { verifyUser, sanitizeFilename, deriveProgram, buildAttendanceGrid, calculateGrade } from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";

  // GET & POST attendance
export const attendanceHandlers = new Elysia()
  .get(
    "/attendance",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, studentId } = query;
        if (studentId) {
          const record = await db
            .select()
            .from(elearningAttendances)
            .where(and(
              eq(elearningAttendances.sessionId, parseInt(sessionId)),
              eq(elearningAttendances.studentId, parseInt(studentId))
            ))
            .get();
          return { success: true, data: record || null };
        } else {
          // Jika studentId tidak ada (mis. dipanggil Tutor), ambil semua data absensi di sesi ini + nama siswa
          const records = await db
            .select({
              id: elearningAttendances.id,
              sessionId: elearningAttendances.sessionId,
              studentId: elearningAttendances.studentId,
              createdAt: elearningAttendances.createdAt,
              studentName: students.nama
            })
            .from(elearningAttendances)
            .innerJoin(students, eq(elearningAttendances.studentId, students.id))
            .where(eq(elearningAttendances.sessionId, parseInt(sessionId)))
            .all();
          return { success: true, data: records || [] };
        }
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/attendance",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        let studentId = body.studentId;
        if (payload && payload.role === "siswa") {
          studentId = payload.id as number;
        } else if (!studentId) {
          return { success: false, message: "studentId diperlukan" };
        }
        const existing = await db
          .select()
          .from(elearningAttendances)
          .where(and(
            eq(elearningAttendances.sessionId, sessionId),
            eq(elearningAttendances.studentId, studentId)
          ))
          .get();

        if (existing) return { success: true, data: existing };

        const inserted = await db
          .insert(elearningAttendances)
          .values({ sessionId, studentId })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          const conflict = await db
            .select()
            .from(elearningAttendances)
            .where(and(eq(elearningAttendances.sessionId, sessionId), eq(elearningAttendances.studentId, studentId)))
            .get();
          return { success: true, data: conflict };
        }

        return { success: true, data: inserted[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        sessionId: t.Number(),
        studentId: t.Optional(t.Number()),
      }),
    }
  )

;
