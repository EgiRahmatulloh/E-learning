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

  // ---------------------------------------------------------
  // SESSION ANGKET PROGRESS (for navigation gating)
  // ---------------------------------------------------------
export const angketHandlers = new Elysia()
  .get("/session-angket/progress", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = Number(query.setupId);
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (payload.role !== "siswa") {
        return { success: true, data: [] };
      }

      const studentId = Number(payload.id);

      const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
      if (!setup) { set.status = 404; return { success: false, message: "Setup not found" }; }

      // Verify student belongs to the setup's rombel
      const studentRombel = await db.select().from(rombelStudents)
        .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
        .where(and(
          eq(rombelStudents.studentId, studentId),
          eq(rombels.nama, setup.kelas)
        )).get();
      if (!studentRombel) {
        set.status = 403;
        return { success: false, message: "Anda tidak terdaftar di kelas ini" };
      }

      const program = deriveProgram(setup.kelas);

      const course = await db.select().from(elearningCourses)
        .where(and(
          eq(elearningCourses.namaMapel, setup.mapel),
          eq(elearningCourses.program, program)
        )).get();
      if (!course) return { success: true, data: [] };

      const sessions = await db.select().from(elearningSessions)
        .where(eq(elearningSessions.courseId, course.id)).all();

      const sessionIds = sessions.map(s => s.id);

      const completedAngkets = sessionIds.length > 0 ? await db
        .select()
        .from(elearningSessionAngkets)
        .where(and(
          inArray(elearningSessionAngkets.sessionId, sessionIds),
          eq(elearningSessionAngkets.studentId, studentId)
        ))
        .all() : [];

      const completedSessionIds = new Set(completedAngkets.map(a => a.sessionId));

      const data = sessions.map(s => ({
        sessionNumber: s.sessionNumber,
        completed: completedSessionIds.has(s.id)
      }));

      return { success: true, data };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })

  // ---------------------------------------------------------
  // SESSION ANGKET (Tutor Evaluation per Session)
  // ---------------------------------------------------------
  .get("/session-angket", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const sessionId = Number(query.sessionId);
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      if (payload.role !== "siswa") {
        return { success: true, completed: true }; // non-siswa don't need this
      }

      const studentId = Number(payload.id);

      // Verify student belongs to this session's rombel
      const session = await db.select().from(elearningSessions).where(eq(elearningSessions.id, sessionId)).get();
      if (session) {
        const course = await db.select().from(elearningCourses).where(eq(elearningCourses.id, session.courseId)).get();
        if (course) {
          const allSetups = await db.select().from(elearningSetups).all();
          const matchingKelas = allSetups
            .filter(s => s.mapel === course.namaMapel && deriveProgram(s.kelas) === course.program)
            .map(s => s.kelas);
          if (matchingKelas.length > 0) {
            const rombelCheck = await db.select().from(rombelStudents)
              .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
              .where(and(
                eq(rombelStudents.studentId, studentId),
                inArray(rombels.nama, matchingKelas)
              )).get();
            if (!rombelCheck) {
              set.status = 403;
              return { success: false, message: "Anda tidak terdaftar di kelas ini" };
            }
          }
        }
      }

      // Check if there's any record for this session + student
      const record = await db.select().from(elearningSessionAngkets)
        .where(and(
          eq(elearningSessionAngkets.sessionId, sessionId),
          eq(elearningSessionAngkets.studentId, studentId)
        )).limit(1).get();

      return { success: true, completed: !!record };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post("/session-angket", async (context: any) => {
    const { headers, jwt, body, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const { sessionId, responses } = body;
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      if (payload.role !== "siswa") {
        set.status = 403;
        return { success: false, message: "Only siswa can submit angket" };
      }

      const studentId = Number(payload.id);

      // Verify student belongs to this session's rombel
      const session = await db.select().from(elearningSessions).where(eq(elearningSessions.id, Number(sessionId))).get();
      if (session) {
        const course = await db.select().from(elearningCourses).where(eq(elearningCourses.id, session.courseId)).get();
        if (course) {
          const allSetups = await db.select().from(elearningSetups).all();
          const matchingKelas = allSetups
            .filter(s => s.mapel === course.namaMapel && deriveProgram(s.kelas) === course.program)
            .map(s => s.kelas);
          if (matchingKelas.length > 0) {
            const rombelCheck = await db.select().from(rombelStudents)
              .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
              .where(and(
                eq(rombelStudents.studentId, studentId),
                inArray(rombels.nama, matchingKelas)
              )).get();
            if (!rombelCheck) {
              set.status = 403;
              return { success: false, message: "Anda tidak terdaftar di kelas ini" };
            }
          }
        }
      }

      for (const res of responses) {
        try {
          await db.insert(elearningSessionAngkets).values({
            sessionId: Number(sessionId),
            studentId,
            evaluationId: Number(res.evaluationId),
            score: Number(res.score),
          });
        } catch (e: any) {
          // Only ignore unique constraint violations (already submitted)
          // Re-throw other errors so they propagate to the outer catch
          if (!e?.message?.includes("UNIQUE constraint failed")) {
            throw e;
          }
        }
      }

      return { success: true, message: "Angket berhasil disubmit" };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  }, {
    body: t.Object({
      sessionId: t.Numeric(),
      responses: t.Array(t.Object({
        evaluationId: t.Numeric(),
        score: t.Numeric()
      }))
    })
  });
;
