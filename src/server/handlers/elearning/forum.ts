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

  // GET forum posts
export const forumHandlers = new Elysia()
  .get(
    "/forum",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        let condition;
        if (query.sessionId) {
          condition = eq(elearningForumPosts.sessionId, parseInt(query.sessionId));
        } else if (query.courseId) {
          condition = eq(elearningForumPosts.courseId, parseInt(query.courseId));
        } else {
          return { success: false, message: "sessionId atau courseId diperlukan" };
        }

        const posts = await db
          .select()
          .from(elearningForumPosts)
          .where(condition)
          .orderBy(elearningForumPosts.createdAt)
          .all();

        // Ambil data nama dari tutors dan students untuk enrich authorName
        const allTutors = await db.select().from(tutors).all();
        const allStudents = await db.select().from(students).all();

        const enrichedPosts = posts.map(post => {
          let authorName = "Unknown";
          if (post.authorRole === "tutor") {
            const tutor = allTutors.find(t => t.id === post.authorId);
            if (tutor) authorName = tutor.nama;
          } else {
            const student = allStudents.find(s => s.id === post.authorId);
            if (student) authorName = student.nama;
          }
          return {
            ...post,
            authorName
          };
        });

        return { success: true, data: enrichedPosts };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // POST forum post
  .post(
    "/forum",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, courseId, content, parentId } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const cleanHtml = sanitizeHtml(content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['style', 'class']
          }
        });

        const inserted = await db
          .insert(elearningForumPosts)
          .values({
            sessionId,
            courseId,
            authorId: payload.id as number,
            authorRole: payload.role as string,
            content: cleanHtml,
            parentId: parentId || null,
          })
          .returning();

        return { success: true, data: inserted[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        sessionId: t.Number(),
        courseId: t.Number(),
        content: t.String(),
        parentId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )

  // PUT update forum post
  .put(
    "/forum/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const postId = parseInt(id);
        const existingPost = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.id, postId)).get();

        if (!existingPost) {
          set.status = 404;
          return { success: false, message: "Pesan tidak ditemukan" };
        }

        if (existingPost.authorId !== payload.id || existingPost.authorRole !== payload.role) {
          set.status = 403;
          return { success: false, message: "Tidak memiliki akses untuk mengubah pesan ini" };
        }

        const cleanHtml = sanitizeHtml(body.content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['style', 'class']
          }
        });

        const updated = await db
          .update(elearningForumPosts)
          .set({ content: cleanHtml })
          .where(eq(elearningForumPosts.id, postId))
          .returning();

        return { success: true, data: updated[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )

  // DELETE forum post
  .delete(
    "/forum/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const postId = parseInt(id);
        const existingPost = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.id, postId)).get();

        if (!existingPost) {
          set.status = 404;
          return { success: false, message: "Pesan tidak ditemukan" };
        }

        if (existingPost.authorId !== payload.id || existingPost.authorRole !== payload.role) {
          set.status = 403;
          return { success: false, message: "Tidak memiliki akses untuk menghapus pesan ini" };
        }

        // Delete children (replies) if any, then the post itself
        await db.delete(elearningForumPosts).where(eq(elearningForumPosts.parentId, postId));
        await db.delete(elearningForumPosts).where(eq(elearningForumPosts.id, postId));

        return { success: true, message: "Pesan berhasil dihapus" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

;
