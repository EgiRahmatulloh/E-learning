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

  // ---------------------------------------------------------
  // TUTOR ATTENDANCE
  // ---------------------------------------------------------
export const tutorAttendanceHandlers = new Elysia()
  .get("/tutor-attendance", async (context: any) => {
    const { headers, jwt, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload.role !== "tutor") {
        return { success: true, attended: false }; // Not a tutor
      }

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
      const record = await db.select().from(tutorAttendances)
        .where(and(
          eq(tutorAttendances.tutorId, Number(payload.id)),
          eq(tutorAttendances.date, today)
        )).get();

      return { success: true, attended: !!record };
    } catch (error: any) {
      set.status = 500;
      console.error("TutorAttendance error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })
  .post("/tutor-attendance", async (context: any) => {
    const { headers, jwt, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload.role !== "tutor") {
        set.status = 403;
        return { success: false, message: "Only tutors can mark attendance here" };
      }

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      try {
        await db.insert(tutorAttendances).values({
          tutorId: Number(payload.id),
          date: today,
        });
        return { success: true, message: "Kehadiran berhasil ditandai" };
      } catch (err: any) {
        if (err.message && err.message.includes("UNIQUE constraint failed")) {
          return { success: true, message: "Sudah absen hari ini" };
        }
        throw err;
      }
    } catch (error: any) {
      set.status = 500;
      console.error("TutorAttendance error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })
  .get("/tutor-attendance/history", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      const tutorId = payload.role === "tutor" ? Number(payload.id) : (query.tutorId ? Number(query.tutorId) : null);
      if (!tutorId) {
        set.status = 400;
        return { success: false, message: "Tutor ID required" };
      }

      const year = query.year ? Number(query.year) : new Date().getFullYear();
      const month = query.month ? Number(query.month) : (new Date().getMonth() + 1); // 1-12
      
      const prefix = `${year}-${month.toString().padStart(2, '0')}`;
      
      const records = await db.select().from(tutorAttendances)
        .where(and(
          eq(tutorAttendances.tutorId, tutorId),
          like(tutorAttendances.date, `${prefix}%`)
        )).all();

      return { success: true, data: records };
    } catch (error: any) {
      set.status = 500;
      console.error("TutorAttendance error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

;
