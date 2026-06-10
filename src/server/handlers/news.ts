/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { news, newsCategories } from "../models";
import { eq } from "drizzle-orm";
import { verifyAdmin, getAdminPayload } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const newsHandlers = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: finalJwtSecret,
      schema: t.Object({
        id: t.Numeric(),
        username: t.String(),
        role: t.String(),
        name: t.String(),
        email: t.String(),
      }),
    })
  )
  // --- API NEWS CATEGORIES ROUTES ---
  // Ambil semua kategori berita
  .get("/api/news-categories", async ({ set }) => {
    try {
      const list = await db.select().from(newsCategories).all();
      return { success: true, data: list };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil kategori berita" };
    }
  })
  // Tambah kategori berita baru
  .post(
    "/api/news-categories",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { nama } = body;
      try {
        const inserted = await db.insert(newsCategories).values({ nama }).returning().get();
        return { success: true, data: inserted };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menambahkan kategori berita" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
      }),
    }
  )
  // Hapus kategori berita
  .delete("/api/news-categories/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(newsCategories).where(eq(newsCategories.id, id)).run();
      return { success: true, message: "Kategori berita berhasil dihapus" };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menghapus kategori berita" };
    }
  })
  // --- API NEWS ROUTES ---
  // Ambil semua berita
  .get("/api/news", async ({ set }) => {
    try {
      const list = await db.select().from(news).all();
      return { success: true, data: list };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data berita" };
    }
  })
  // Tambah berita baru
  .post(
    "/api/news",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { judul, kategori, tanggalPosting, status, foto, konten } = body;
      const adminPayload = await getAdminPayload(headers, jwt);
      try {
        const inserted = await db
          .insert(news)
          .values({
            judul,
            kategori,
            pembuat: adminPayload?.name || "-",
            tanggalPosting,
            hits: 0,
            status: status || "PUBLISH",
            foto: foto || "",
            konten: konten || "",
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menambahkan berita" };
      }
    },
    {
      body: t.Object({
        judul: t.String({ minLength: 1 }),
        kategori: t.String({ minLength: 1 }),
        pembuat: t.Optional(t.String()),
        tanggalPosting: t.String({ minLength: 1 }),
        status: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        konten: t.Optional(t.String()),
      }),
    }
  )
  // Increment hits berita (Public)
  .post("/api/news/:id/hit", async ({ params, set }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db.select().from(news).where(eq(news.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Berita tidak ditemukan" };
      }

      const updated = await db
        .update(news)
        .set({
          hits: (existing.hits || 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(news.id, id))
        .returning()
        .get();

      return { success: true, data: updated };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal memperbarui hits berita" };
    }
  })
  // Update berita
  .put(
    "/api/news/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { judul, kategori, tanggalPosting, status, foto, konten } = body;
      try {
        const existing = await db.select().from(news).where(eq(news.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Berita tidak ditemukan" };
        }

        const updated = await db
          .update(news)
          .set({
            judul,
            kategori,
            pembuat: existing.pembuat,
            tanggalPosting,
            status: status ?? existing.status,
            foto: foto ?? existing.foto,
            konten: konten ?? existing.konten,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(news.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memperbarui berita" };
      }
    },
    {
      body: t.Object({
        judul: t.String({ minLength: 1 }),
        kategori: t.String({ minLength: 1 }),
        pembuat: t.Optional(t.String()),
        tanggalPosting: t.String({ minLength: 1 }),
        status: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        konten: t.Optional(t.String()),
      }),
    }
  )
  // Hapus berita
  .delete("/api/news/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(news).where(eq(news.id, id)).run();
      return { success: true, message: "Berita berhasil dihapus" };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menghapus berita" };
    }
  });
