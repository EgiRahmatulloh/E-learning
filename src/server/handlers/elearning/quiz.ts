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

  // === LATIHAN MANDIRI (QUIZ) ===
export const quizHandlers = new Elysia()
  .get(
    "/quiz/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);
        const studentId = payload?.role === "siswa" ? payload.id as number : null;

        const questions = await db.select().from(elearningQuestions).where(eq(elearningQuestions.sessionId, sId)).orderBy(asc(elearningQuestions.id)).all();

        let submission = null;
        if (studentId) {
          submission = await db.select().from(elearningQuizSubmissions).where(and(eq(elearningQuizSubmissions.sessionId, sId), eq(elearningQuizSubmissions.studentId, studentId))).get();
        }

        return { success: true, data: { questions, submission } };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/quiz/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);
        const { questions } = body as { questions: any[] };

        await db.transaction(async (tx) => {
          // Delete existing questions and their corresponding submissions
          await tx.delete(elearningQuestions).where(eq(elearningQuestions.sessionId, sId));
          await tx.delete(elearningQuizSubmissions).where(eq(elearningQuizSubmissions.sessionId, sId));

          // Insert new ones
          if (questions && questions.length > 0) {
            const inserts = questions.map((q: any) => ({
              sessionId: sId,
              question: q.question,
              options: JSON.stringify(q.options),
              correctAnswer: q.correctAnswer
            }));
            await tx.insert(elearningQuestions).values(inserts);
          }
        });

        return { success: true, message: "Soal latihan berhasil disimpan" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        questions: t.Array(
          t.Object({
            question: t.String(),
            options: t.Array(t.String()),
            correctAnswer: t.Number(),
          })
        ),
      }),
    }
  )
  .post(
    "/quiz/:sessionId/submit",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mensubmit kuis" };
        }
        const studentId = payload.id as number;
        const sId = parseInt(sessionId);
        const { answers } = body as { answers: number[] };

        const questions = await db.select().from(elearningQuestions).where(eq(elearningQuestions.sessionId, sId)).orderBy(asc(elearningQuestions.id)).all();

        if (questions.length === 0) {
          return { success: false, message: "Soal kuis tidak ditemukan" };
        }

        let correct = 0;
        for (let i = 0; i < questions.length; i++) {
          if (answers[i] === questions[i].correctAnswer) correct++;
        }

        const grade = Math.round((correct / questions.length) * 100);

        const existing = await db.select().from(elearningQuizSubmissions).where(and(eq(elearningQuizSubmissions.sessionId, sId), eq(elearningQuizSubmissions.studentId, studentId))).get();

        if (existing) {
          await db.update(elearningQuizSubmissions).set({ grade, answers: JSON.stringify(answers) }).where(eq(elearningQuizSubmissions.id, existing.id));
        } else {
          await db.insert(elearningQuizSubmissions).values({ sessionId: sId, studentId, grade, answers: JSON.stringify(answers) });
        }

        return { success: true, message: "Jawaban berhasil disubmit", grade };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        answers: t.Array(t.Number())
      })
    }
  )

;
