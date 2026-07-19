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

  // === COMPLETIONS ===
export const completionsHandlers = new Elysia()
  .get(
    "/completions/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengakses progress completion" };
        }

        const completions = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, parseInt(setupId)),
            eq(elearningSectionCompletions.studentId, payload.id as number)
          )).all();

        return { success: true, data: completions };
      } catch (error: any) {
        set.status = 500;
        console.error("Completions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )
  .post(
    "/completions",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { setupId, sectionKey } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mensubmit completion" };
        }
        const studentId = payload.id as number;

        const existing = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, setupId),
            eq(elearningSectionCompletions.studentId, studentId),
            eq(elearningSectionCompletions.sectionKey, sectionKey)
          )).get();

        if (!existing) {
          await db.insert(elearningSectionCompletions).values({
            studentId,
            setupId,
            sectionKey
          });
        }

        return { success: true, message: "Berhasil menyimpan progress" };
      } catch (error: any) {
        set.status = 500;
        console.error("Completions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        setupId: t.Number(),
        sectionKey: t.String()
      })
    }
  )
  .get(
    "/completions/progress/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengakses progress" };
        }

        const studentId = payload.id as number;
        const setupIdNum = parseInt(setupId);

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupIdNum)).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        // Asumsi section pendahuluan ada 4 (RAT, Tata Tertib, Perkenalan, Inisiasi)
        // Dan tiap sesi ada (Kehadiran, Pengantar, Materi Inisiasi, Pengayaan, Diskusi, Latihan, Tugas) = 7
        const totalSections = 4 + (setup.jumlahSesi * 7);

        const completions = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, setupIdNum),
            eq(elearningSectionCompletions.studentId, studentId)
          )).all();

        const completedSections = completions.length;
        const progress = Math.min(100, Math.round((completedSections / totalSections) * 100));

        return { success: true, progress, completedSections, totalSections };
      } catch (error: any) {
        set.status = 500;
        console.error("Completions error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

;
