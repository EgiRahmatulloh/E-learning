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
import { verifyAdmin, verifyAdminOrTutor, getAdminPayload } from "../../middleware/auth";

import { verifyUser, sanitizeFilename, deriveProgram, buildAttendanceGrid, calculateGrade } from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";

  // GET Submissions
export const submissionsHandlers = new Elysia()
  .get(
    "/submissions/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);
        if (Number.isNaN(sId)) {
          set.status = 400;
          return { success: false, message: "sessionId tidak valid" };
        }
        // Find if there is an assignment for this session
        const assignment = await db.select().from(elearningAssignments).where(eq(elearningAssignments.sessionId, sId)).get();

        if (!assignment) {
          return { success: true, data: [] };
        }

        const submissions = await db.select({
          id: elearningSubmissions.id,
          studentId: elearningSubmissions.studentId,
          studentName: students.nama,
          fileUrl: elearningSubmissions.fileUrl,
          grade: elearningSubmissions.grade,
          feedback: elearningSubmissions.feedback,
          submittedAt: elearningSubmissions.submittedAt,
        })
          .from(elearningSubmissions)
          .leftJoin(students, eq(elearningSubmissions.studentId, students.id))
          .where(eq(elearningSubmissions.assignmentId, assignment.id))
          .all();

        return { success: true, data: submissions };
      } catch (error: any) {
        set.status = 500;
        console.error("Submissions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

  // POST Submission
  .post(
    "/submissions/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengumpulkan tugas" };
        }
        const studentId = payload.id;
        const sId = parseInt(sessionId);
        if (Number.isNaN(sId)) {
          set.status = 400;
          return { success: false, message: "sessionId tidak valid" };
        }
        const { fileUrl } = body as { fileUrl: string };

        // Ensure there is an assignment for this session
        let assignment = await db.select().from(elearningAssignments).where(eq(elearningAssignments.sessionId, sId)).get();
        if (!assignment) {
          // Lookup sessionNumber for a human-readable title
          const session = await db.select({ sessionNumber: elearningSessions.sessionNumber })
            .from(elearningSessions)
            .where(eq(elearningSessions.id, sId))
            .get();
          const sessionLabel = session ? session.sessionNumber : sId;

          const insertResult = await db.insert(elearningAssignments).values({
            sessionId: sId,
            title: `Tugas Sesi ${sessionLabel}`,
            description: "",
            fileUrl: ""
          })
          .onConflictDoNothing()
          .returning();
          
          if (insertResult.length === 0) {
            assignment = await db.select().from(elearningAssignments).where(eq(elearningAssignments.sessionId, sId)).get();
          } else {
            assignment = insertResult[0];
          }
        }

        const existing = await db.select().from(elearningSubmissions)
          .where(and(
            eq(elearningSubmissions.assignmentId, assignment.id),
            eq(elearningSubmissions.studentId, studentId)
          )).get();

        if (existing) {
          await db.update(elearningSubmissions).set({ fileUrl, submittedAt: new Date().toISOString(), grade: null, feedback: null, gradedAt: null })
            .where(eq(elearningSubmissions.id, existing.id));
        } else {
          await db.insert(elearningSubmissions).values({
            assignmentId: assignment.id,
            studentId,
            fileUrl
          });
        }

        return { success: true, message: "Berhasil mengumpulkan tugas" };
      } catch (error: any) {
        set.status = 500;
        console.error("Submissions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

  // PUT Grade Submission
  .put(
    "/submissions/:submissionId/grade",
    async (context: any) => {
      const { headers, jwt, params: { submissionId }, body, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const payload = await getAdminPayload(headers, jwt);
        if (!payload) {
          set.status = 401;
          return { success: false, message: "Token tidak valid" };
        }

        const subId = parseInt(submissionId);
        if (Number.isNaN(subId)) {
          set.status = 400;
          return { success: false, message: "submissionId tidak valid" };
        }
        const { grade, feedback } = body as { grade: number; feedback?: string };
        if (typeof grade !== "number" || Number.isNaN(grade) || grade < 0 || grade > 100) {
          set.status = 400;
          return { success: false, message: "Nilai harus antara 0 dan 100" };
        }
        const result = await db.update(elearningSubmissions).set({
          grade,
          feedback,
          gradedAt: new Date().toISOString(),
          gradedBy: payload.id ?? null,
        }).where(eq(elearningSubmissions.id, subId)).returning();
        if (result.length === 0) {
          set.status = 404;
          return { success: false, message: "Submission tidak ditemukan" };
        }
        return { success: true, message: "Berhasil memberikan nilai" };
      } catch (error: any) {
        set.status = 500;
        console.error("Submissions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        grade: t.Number(),
        feedback: t.Optional(t.String()),
      })
    }
  )

;
