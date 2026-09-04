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
import {
  verifyAdmin,
  verifyAdminOrTutor,
  getAdminPayload,
} from "../../middleware/auth";

import {
  verifyUser,
  sanitizeFilename,
  deriveProgram,
  buildAttendanceGrid,
  calculateGrade,
} from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";
import { cleanupReplacedFiles } from "../../services/storage";

// GET Submissions
export const submissionsHandlers = new Elysia()
  .get("/submissions/:sessionId", async (context: any) => {
    const {
      headers,
      jwt,
      params: { sessionId },
      set,
    } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const sId = parseInt(sessionId);
      if (Number.isNaN(sId)) {
        set.status = 400;
        return { success: false, message: "sessionId tidak valid" };
      }
      // Find if there is an assignment for this session
      const assignment = await db
        .select()
        .from(elearningAssignments)
        .where(eq(elearningAssignments.sessionId, sId))
        .get();

      if (!assignment) {
        return { success: true, data: [] };
      }

      const submissions = await db
        .select({
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
  })

  // POST Submission
  .post("/submissions/:sessionId", async (context: any) => {
    const {
      headers,
      jwt,
      params: { sessionId },
      body,
      set,
    } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader!.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || payload.role !== "siswa") {
        return {
          success: false,
          message: "Hanya siswa yang dapat mengumpulkan tugas",
        };
      }
      const studentId = payload.id;
      const sId = parseInt(sessionId);
      if (Number.isNaN(sId)) {
        set.status = 400;
        return { success: false, message: "sessionId tidak valid" };
      }
      const { fileUrl } = body as { fileUrl: string };

      // Ensure there is an assignment for this session
      let assignment = await db
        .select()
        .from(elearningAssignments)
        .where(eq(elearningAssignments.sessionId, sId))
        .get();
      if (!assignment) {
        // Lookup sessionNumber for a human-readable title
        const session = await db
          .select({ sessionNumber: elearningSessions.sessionNumber })
          .from(elearningSessions)
          .where(eq(elearningSessions.id, sId))
          .get();
        const sessionLabel = session ? session.sessionNumber : sId;

        const insertResult = await db
          .insert(elearningAssignments)
          .values({
            sessionId: sId,
            title: `Tugas Sesi ${sessionLabel}`,
            description: "",
            fileUrl: "",
          })
          .onConflictDoNothing()
          .returning();

        if (insertResult.length === 0) {
          assignment = await db
            .select()
            .from(elearningAssignments)
            .where(eq(elearningAssignments.sessionId, sId))
            .get();
        } else {
          assignment = insertResult[0];
        }
      }

      const existing = await db
        .select()
        .from(elearningSubmissions)
        .where(
          and(
            eq(elearningSubmissions.assignmentId, assignment.id),
            eq(elearningSubmissions.studentId, studentId),
          ),
        )
        .get();

      if (existing) {
        await db
          .update(elearningSubmissions)
          .set({
            fileUrl,
            submittedAt: new Date().toISOString(),
            grade: null,
            feedback: null,
            gradedAt: null,
          })
          .where(eq(elearningSubmissions.id, existing.id));
        // Kumpul ulang menggantikan berkas sebelumnya — berkas lama tidak bisa
        // diakses lagi dari mana pun, jadi lepas dari storage.
        await cleanupReplacedFiles(existing, { fileUrl }, ["fileUrl"]);
      } else {
        await db.insert(elearningSubmissions).values({
          assignmentId: assignment.id,
          studentId,
          fileUrl,
        });
      }

      return { success: true, message: "Berhasil mengumpulkan tugas" };
    } catch (error: any) {
      set.status = 500;
      console.error("Submissions error:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  })

  // PUT Grade Submission
  .put(
    "/submissions/:submissionId/grade",
    async (context: any) => {
      const {
        headers,
        jwt,
        params: { submissionId },
        body,
        set,
      } = context;
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
        const { grade, feedback } = body as {
          grade: number;
          feedback?: string;
        };
        if (
          typeof grade !== "number" ||
          Number.isNaN(grade) ||
          grade < 0 ||
          grade > 100
        ) {
          set.status = 400;
          return { success: false, message: "Nilai harus antara 0 dan 100" };
        }
        const result = await db
          .update(elearningSubmissions)
          .set({
            grade,
            feedback,
            gradedAt: new Date().toISOString(),
            gradedBy: payload.id ?? null,
          })
          .where(eq(elearningSubmissions.id, subId))
          .returning();
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
      }),
    },
  )

  // GET Download All ZIP
  .get("/submissions/:sessionId/download-zip", async (context: any) => {
    const {
      headers,
      jwt,
      params: { sessionId },
      set,
    } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const sId = parseInt(sessionId);
      if (Number.isNaN(sId)) {
        set.status = 400;
        return { success: false, message: "sessionId tidak valid" };
      }

      const assignment = await db
        .select()
        .from(elearningAssignments)
        .where(eq(elearningAssignments.sessionId, sId))
        .get();
      if (!assignment) {
        set.status = 404;
        return {
          success: false,
          message: "Belum ada pengaturan tugas untuk sesi ini",
        };
      }

      const { isNotNull } = await import("drizzle-orm");
      const submissionsList = await db
        .select({
          studentName: students.nama,
          fileUrl: elearningSubmissions.fileUrl,
        })
        .from(elearningSubmissions)
        .leftJoin(students, eq(elearningSubmissions.studentId, students.id))
        .where(
          and(
            eq(elearningSubmissions.assignmentId, assignment.id),
            isNotNull(elearningSubmissions.fileUrl),
          ),
        )
        .all();

      if (submissionsList.length === 0) {
        set.status = 404;
        return { success: false, message: "Belum ada file yang terkumpul" };
      }

      const fflate = await import("fflate");
      const zipObj: Record<string, Uint8Array> = {};
      let successCount = 0;

      for (const sub of submissionsList) {
        if (!sub.fileUrl) continue;
        try {
          // Kita asumsikan file berada di domain yang sama (localhost/production URL).
          // Dalam environment Elysia, kita bisa mengambilnya langsung dari sistem file atau via host asli
          let fileData: ArrayBuffer;
          if (sub.fileUrl.startsWith("http")) {
            const res = await fetch(sub.fileUrl);
            if (!res.ok) continue;
            fileData = await res.arrayBuffer();
          } else {
            // local file
            const filePath = sub.fileUrl.startsWith("/")
              ? `.${sub.fileUrl}`
              : sub.fileUrl;
            const file = Bun.file(filePath);
            if (!(await file.exists())) continue;
            fileData = await file.arrayBuffer();
          }

          const ext = sub.fileUrl.split(".").pop() || "pdf";
          const safeName = (sub.studentName || "Anonim").replace(
            /[^a-zA-Z0-9]/g,
            "_",
          );
          const fileName = `${safeName}_Tugas.${ext}`;
          zipObj[fileName] = new Uint8Array(fileData);
          successCount++;
        } catch (err) {
          console.error("Failed to read file:", sub.fileUrl, err);
        }
      }

      if (successCount === 0) {
        set.status = 500;
        return {
          success: false,
          message: "Gagal memproses berkas, tidak ada yang bisa di-zip",
        };
      }

      const zippedData = fflate.zipSync(zipObj);

      set.headers = {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="submissions_sesi_${sId}.zip"`,
      };
      return zippedData;
    } catch (error: any) {
      set.status = 500;
      console.error("ZIP error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server saat membuat ZIP",
      };
    }
  });
