/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import {
  sliders,
  announcements,
  institutionProfile,
  visionMission,
  educationPrograms,
  facilities,
  achievements,
  servicePoints,
  agendas,
  downloads,
  products,
  alumni,
  gallery,
} from "../models";
import { eq, sql } from "drizzle-orm";
import { verifyAdmin, getAdminPayload } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const contentHandlers = new Elysia()
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
  // --- API SLIDER ROUTES ---
  .get("/api/sliders", async ({ headers, jwt, set }) => {
    try {
      const list = await db.select().from(sliders).all();
      // Publik hanya melihat slider aktif; admin melihat semua (untuk halaman manajemen)
      const payload = await getAdminPayload(headers, jwt);
      const isAdmin = payload && (payload.role === "admin" || payload.role === "super_admin");
      const data = isAdmin ? list : list.filter((item: any) => item.status !== "NON AKTIF");
      return { success: true, data };
    } catch (err) {
      console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data slider" };
    }
  })
  .post(
    "/api/sliders",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { title, image, status } = body as any;
      const adminPayload = await getAdminPayload(headers, jwt);
      try {
        const inserted = await db
          .insert(sliders)
          .values({
            title,
            image,
            status: status || "AKTIF",
            creator: adminPayload?.name || "-",
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data slider" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        image: t.String(),
        status: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/api/sliders/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { title, image, status } = body as any;
      try {
        const updated = await db
          .update(sliders)
          .set({
            title,
            image,
            status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(sliders.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Slider tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data slider" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        image: t.String(),
        status: t.String(),
      }),
    }
  )
  .delete("/api/sliders/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(sliders).where(eq(sliders.id, id)).run();
      return { success: true, message: "Slider berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus slider" };
    }
  })

  // --- API ANNOUNCEMENT ROUTES ---
  .get("/api/announcements", async ({ headers, jwt, set }) => {
    try {
      const list = await db.select().from(announcements).all();
      // Publik hanya melihat pengumuman aktif; admin melihat semua (untuk halaman manajemen)
      const payload = await getAdminPayload(headers, jwt);
      const isAdmin = payload && (payload.role === "admin" || payload.role === "super_admin");
      const data = isAdmin ? list : list.filter((item: any) => item.status !== "TIDAK AKTIF");
      return { success: true, data };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data pengumuman" };
    }
  })
  .post(
    "/api/announcements",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { text, date, status } = body as any;
      const adminPayload = await getAdminPayload(headers, jwt);
      try {
        const inserted = await db
          .insert(announcements)
          .values({
            text,
            date,
            status: status || "AKTIF",
            creator: adminPayload?.name || "-",
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data pengumuman" };
      }
    },
    {
      body: t.Object({
        text: t.String({ minLength: 1 }),
        date: t.String({ minLength: 10, maxLength: 10 }),
        status: t.Optional(t.Union([t.Literal("AKTIF"), t.Literal("TIDAK AKTIF")])),
      }),
    }
  )
  .put(
    "/api/announcements/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { text, date, status } = body as any;
      try {
        const updated = await db
          .update(announcements)
          .set({
            text,
            date,
            status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(announcements.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Pengumuman tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data pengumuman" };
      }
    },
    {
      body: t.Object({
        text: t.String({ minLength: 1 }),
        date: t.String({ minLength: 10, maxLength: 10 }),
        status: t.Union([t.Literal("AKTIF"), t.Literal("TIDAK AKTIF")]),
      }),
    }
  )
  .delete("/api/announcements/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(announcements).where(eq(announcements.id, id)).run();
      return { success: true, message: "Pengumuman berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus pengumuman" };
    }
  })

  // --- API INSTITUTION PROFILE ROUTES ---
  .get("/api/institution-profile", async ({ set }) => {
    try {
      const profile = await db.select().from(institutionProfile).get();
      return { success: true, data: profile || null };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data identitas lembaga" };
    }
  })
  .post(
    "/api/institution-profile",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const existing = await db.select().from(institutionProfile).get();
        if (existing) {
          const updated = await db
            .update(institutionProfile)
            .set({
              ...(body as any),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(institutionProfile.id, existing.id))
            .returning()
            .get();
          return { success: true, data: updated };
        } else {
          const inserted = await db.insert(institutionProfile).values(body as any).returning().get();
          return { success: true, data: inserted };
        }
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menyimpan data identitas lembaga" };
      }
    },
    {
      body: t.Object({
        namaLembaga: t.String(),
        npsn: t.String(),
        nomorIndukLembaga: t.String(),
        statusAkreditasi: t.String(),
        tahunBerdiri: t.String(),
        nomorTelepon: t.String(),
        email: t.String(),
        alamatLengkap: t.String(),
        noIzinPendirian: t.String(),
        izinYayasan: t.String(),
        izinOperasional: t.String(),
        npwp: t.String(),
        rekeningNomor: t.String(),
        rekeningAtasNama: t.String(),
        rekeningNamaBank: t.String(),
        foto: t.String(),
        gambar: t.String(),
      }),
    }
  )

  // --- API VISION & MISSION ROUTES ---
  .get("/api/vision-mission", async ({ set }) => {
    try {
      const vm = await db.select().from(visionMission).get();
      return { success: true, data: vm || null };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data visi dan misi" };
    }
  })
  .post(
    "/api/vision-mission",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { visi, misi } = body as any;
      try {
        const existing = await db.select().from(visionMission).get();
        if (existing) {
          const updated = await db
            .update(visionMission)
            .set({
              visi,
              misi,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(visionMission.id, existing.id))
            .returning()
            .get();
          return { success: true, data: updated };
        } else {
          const inserted = await db.insert(visionMission).values({ visi, misi }).returning().get();
          return { success: true, data: inserted };
        }
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menyimpan data visi dan misi" };
      }
    },
    {
      body: t.Object({
        visi: t.String(),
        misi: t.String(),
      }),
    }
  )

  // --- API EDUCATION PROGRAMS ROUTES ---
  .get("/api/education-programs", async ({ set }) => {
    try {
      const list = await db.select().from(educationPrograms).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data program pendidikan" };
    }
  })
  .post(
    "/api/education-programs",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { program, penjab, keterangan, foto } = body as any;
      try {
        const inserted = await db
          .insert(educationPrograms)
          .values({
            program,
            penjab,
            keterangan,
            foto,
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan program pendidikan" };
      }
    },
    {
      body: t.Object({
        program: t.String({ minLength: 1 }),
        penjab: t.String({ minLength: 1 }),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .put(
    "/api/education-programs/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { program, penjab, keterangan, foto } = body as any;
      try {
        const updated = await db
          .update(educationPrograms)
          .set({
            program,
            penjab,
            keterangan,
            foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(educationPrograms.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Program pendidikan tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui program pendidikan" };
      }
    },
    {
      body: t.Object({
        program: t.String({ minLength: 1 }),
        penjab: t.String({ minLength: 1 }),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .delete("/api/education-programs/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db
        .select()
        .from(educationPrograms)
        .where(eq(educationPrograms.id, id))
        .get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Program pendidikan tidak ditemukan" };
      }
      await db.delete(educationPrograms).where(eq(educationPrograms.id, id)).run();
      return { success: true, message: "Program pendidikan berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus program pendidikan" };
    }
  })

  // --- API FACILITIES ROUTES ---
  .get("/api/facilities", async ({ set }) => {
    try {
      const list = await db.select().from(facilities).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data sarana dan fasilitas" };
    }
  })
  .post(
    "/api/facilities",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { nama, keterangan, foto } = body as any;
      try {
        const inserted = await db
          .insert(facilities)
          .values({
            nama,
            keterangan,
            foto,
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data sarana dan fasilitas" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .put(
    "/api/facilities/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { nama, keterangan, foto } = body as any;
      try {
        const existing = await db.select().from(facilities).where(eq(facilities.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Sarana dan fasilitas tidak ditemukan" };
        }

        const updated = await db
          .update(facilities)
          .set({
            nama,
            keterangan,
            foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(facilities.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data sarana dan fasilitas" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .delete("/api/facilities/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db.select().from(facilities).where(eq(facilities.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Sarana dan fasilitas tidak ditemukan" };
      }

      await db.delete(facilities).where(eq(facilities.id, id)).run();
      return { success: true, message: "Sarana dan fasilitas berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data sarana dan fasilitas" };
    }
  })
  .post(
    "/api/facilities/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const existingRecords = await db.select({ nama: facilities.nama }).from(facilities).all();
        const existingNames = new Set(existingRecords.map(e => e.nama.trim().toLowerCase()));
        const seenNamesInList = new Set<string>();

        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0 &&
            !existingNames.has(item.nama.trim().toLowerCase()) &&
            (() => {
              const normalized = item.nama.trim().toLowerCase();
              if (seenNamesInList.has(normalized)) return false;
              seenNamesInList.add(normalized);
              return true;
            })()
        );
        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const insertValues = validItems.map((item) => ({
          nama: item.nama,
          keterangan: typeof item.keterangan === "string" ? item.keterangan : "",
          foto: typeof item.foto === "string" ? item.foto : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(facilities).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${insertValues.length} sarana dan fasilitas`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data sarana dan fasilitas:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data sarana dan fasilitas" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          keterangan: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  )

  // --- API ACHIEVEMENTS ROUTES ---
  .get("/api/achievements", async ({ set }) => {
    try {
      const list = await db.select().from(achievements).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data prestasi" };
    }
  })
  .post(
    "/api/achievements",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { nama, tahun, tingkat, penyelenggara, peserta, keterangan, foto } = body as any;
      try {
        const inserted = await db
          .insert(achievements)
          .values({
            nama,
            tahun,
            tingkat,
            penyelenggara,
            peserta,
            keterangan,
            foto,
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data prestasi" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        tahun: t.String({ minLength: 1 }),
        tingkat: t.String({ minLength: 1 }),
        penyelenggara: t.String(),
        peserta: t.String(),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .put(
    "/api/achievements/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { nama, tahun, tingkat, penyelenggara, peserta, keterangan, foto } = body as any;
      try {
        const existing = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, id))
          .get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Data prestasi tidak ditemukan" };
        }

        const updated = await db
          .update(achievements)
          .set({
            nama,
            tahun,
            tingkat,
            penyelenggara,
            peserta,
            keterangan,
            foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(achievements.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data prestasi" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        tahun: t.String({ minLength: 1 }),
        tingkat: t.String({ minLength: 1 }),
        penyelenggara: t.String(),
        peserta: t.String(),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .delete("/api/achievements/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, id))
        .get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Data prestasi tidak ditemukan" };
      }

      await db.delete(achievements).where(eq(achievements.id, id)).run();
      return { success: true, message: "Data prestasi berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data prestasi" };
    }
  })
  .post(
    "/api/achievements/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0 &&
            typeof item.tahun === "string" &&
            item.tahun.trim().length > 0 &&
            typeof item.tingkat === "string" &&
            item.tingkat.trim().length > 0
        );

        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const insertValues = validItems.map((item) => ({
          nama: item.nama,
          tahun: item.tahun,
          tingkat: item.tingkat,
          penyelenggara: typeof item.penyelenggara === "string" ? item.penyelenggara : "",
          peserta: typeof item.peserta === "string" ? item.peserta : "",
          keterangan: typeof item.keterangan === "string" ? item.keterangan : "",
          foto: typeof item.foto === "string" ? item.foto : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(achievements).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${insertValues.length} data prestasi`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data prestasi:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data prestasi" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          tahun: t.String({ minLength: 1 }),
          tingkat: t.String({ minLength: 1 }),
          penyelenggara: t.Optional(t.String()),
          peserta: t.Optional(t.String()),
          keterangan: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  )

  // --- API SERVICE POINTS ROUTES ---
  .get("/api/service-points", async ({ set }) => {
    try {
      const list = await db.select().from(servicePoints).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data titik layanan" };
    }
  })
  .post(
    "/api/service-points",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { nama, alamat, penjab, waktuPembelajaran, jumlahWb, keterangan, foto } = body as any;
      try {
        const inserted = await db
          .insert(servicePoints)
          .values({
            nama,
            alamat,
            penjab,
            waktuPembelajaran,
            jumlahWb,
            keterangan,
            foto,
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data titik layanan" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        alamat: t.String({ minLength: 1 }),
        penjab: t.String({ minLength: 1 }),
        waktuPembelajaran: t.String(),
        jumlahWb: t.String(),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .put(
    "/api/service-points/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { nama, alamat, penjab, waktuPembelajaran, jumlahWb, keterangan, foto } = body as any;
      try {
        const existing = await db
          .select()
          .from(servicePoints)
          .where(eq(servicePoints.id, id))
          .get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Data titik layanan tidak ditemukan" };
        }

        const updated = await db
          .update(servicePoints)
          .set({
            nama,
            alamat,
            penjab,
            waktuPembelajaran,
            jumlahWb,
            keterangan,
            foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(servicePoints.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data titik layanan" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        alamat: t.String({ minLength: 1 }),
        penjab: t.String({ minLength: 1 }),
        waktuPembelajaran: t.String(),
        jumlahWb: t.String(),
        keterangan: t.String(),
        foto: t.String(),
      }),
    }
  )
  .delete("/api/service-points/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, id))
        .get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Data titik layanan tidak ditemukan" };
      }

      await db.delete(servicePoints).where(eq(servicePoints.id, id)).run();
      return { success: true, message: "Data titik layanan berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data titik layanan" };
    }
  })
  .post(
    "/api/service-points/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0 &&
            typeof item.alamat === "string" &&
            item.alamat.trim().length > 0 &&
            typeof item.penjab === "string" &&
            item.penjab.trim().length > 0
        );

        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const insertValues = validItems.map((item) => ({
          nama: item.nama,
          alamat: item.alamat,
          penjab: item.penjab,
          waktuPembelajaran:
            typeof item.waktuPembelajaran === "string" ? item.waktuPembelajaran : "",
          jumlahWb: typeof item.jumlahWb === "string" ? item.jumlahWb : "",
          keterangan: typeof item.keterangan === "string" ? item.keterangan : "",
          foto: typeof item.foto === "string" ? item.foto : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(servicePoints).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${insertValues.length} data titik layanan`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data titik layanan:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data titik layanan" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          alamat: t.String({ minLength: 1 }),
          penjab: t.String({ minLength: 1 }),
          waktuPembelajaran: t.Optional(t.String()),
          jumlahWb: t.Optional(t.String()),
          keterangan: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  )

  // --- API AGENDAS ROUTES ---
  .get("/api/agendas", async ({ set }) => {
    try {
      const list = await db.select().from(agendas).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data agenda" };
    }
  })
  .post(
    "/api/agendas",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const {
        nama,
        pelaksanaan,
        waktu,
        peserta,
        lokasi,
        penyelenggara,
        penanggungjawab,
        keterangan,
        foto,
      } = body as any;
      try {
        const inserted = await db
          .insert(agendas)
          .values({
            nama,
            pelaksanaan,
            waktu,
            peserta: peserta || "",
            lokasi: lokasi || "",
            penyelenggara: penyelenggara || "",
            penanggungjawab: penanggungjawab || "",
            keterangan: keterangan || "",
            foto: foto || "",
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data agenda" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        pelaksanaan: t.String({ minLength: 1 }),
        waktu: t.String({ minLength: 1 }),
        peserta: t.Optional(t.String()),
        lokasi: t.Optional(t.String()),
        penyelenggara: t.Optional(t.String()),
        penanggungjawab: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
        foto: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/api/agendas/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const {
        nama,
        pelaksanaan,
        waktu,
        peserta,
        lokasi,
        penyelenggara,
        penanggungjawab,
        keterangan,
        foto,
      } = body as any;
      try {
        const existing = await db.select().from(agendas).where(eq(agendas.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Data agenda tidak ditemukan" };
        }

        const updated = await db
          .update(agendas)
          .set({
            nama,
            pelaksanaan,
            waktu,
            peserta: peserta ?? existing.peserta,
            lokasi: lokasi ?? existing.lokasi,
            penyelenggara: penyelenggara ?? existing.penyelenggara,
            penanggungjawab: penanggungjawab ?? existing.penanggungjawab,
            keterangan: keterangan ?? existing.keterangan,
            foto: foto ?? existing.foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(agendas.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data agenda" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        pelaksanaan: t.String({ minLength: 1 }),
        waktu: t.String({ minLength: 1 }),
        peserta: t.Optional(t.String()),
        lokasi: t.Optional(t.String()),
        penyelenggara: t.Optional(t.String()),
        penanggungjawab: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
        foto: t.Optional(t.String()),
      }),
    }
  )
  .delete("/api/agendas/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db.select().from(agendas).where(eq(agendas.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Data agenda tidak ditemukan" };
      }

      await db.delete(agendas).where(eq(agendas.id, id)).run();
      return { success: true, message: "Data agenda berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data agenda" };
    }
  })
  .post(
    "/api/agendas/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const existingRecords = await db.select({ nama: agendas.nama }).from(agendas).all();
        const existingNames = new Set(existingRecords.map(e => e.nama.trim().toLowerCase()));
        const seenNamesInList = new Set<string>();

        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0 &&
            !existingNames.has(item.nama.trim().toLowerCase()) &&
            (() => {
              const normalized = item.nama.trim().toLowerCase();
              if (seenNamesInList.has(normalized)) return false;
              seenNamesInList.add(normalized);
              return true;
            })() &&
            typeof item.pelaksanaan === "string" &&
            item.pelaksanaan.trim().length > 0 &&
            typeof item.waktu === "string" &&
            item.waktu.trim().length > 0
        );

        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const insertValues = validItems.map((item) => ({
          nama: item.nama,
          pelaksanaan: item.pelaksanaan,
          waktu: item.waktu,
          peserta: typeof item.peserta === "string" ? item.peserta : "",
          lokasi: typeof item.lokasi === "string" ? item.lokasi : "",
          penyelenggara: typeof item.penyelenggara === "string" ? item.penyelenggara : "",
          penanggungjawab: typeof item.penanggungjawab === "string" ? item.penanggungjawab : "",
          keterangan: typeof item.keterangan === "string" ? item.keterangan : "",
          foto: typeof item.foto === "string" ? item.foto : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(agendas).values(chunk).run();
          }
        });
        return { success: true, message: `Berhasil mengimpor ${insertValues.length} data agenda` };
      } catch (err) {
        console.error("Gagal mengimpor data agenda:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data agenda" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          pelaksanaan: t.String({ minLength: 1 }),
          waktu: t.String({ minLength: 1 }),
          peserta: t.Optional(t.String()),
          lokasi: t.Optional(t.String()),
          penyelenggara: t.Optional(t.String()),
          penanggungjawab: t.Optional(t.String()),
          keterangan: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  )

  // --- API DOWNLOADS ROUTES ---
  .get("/api/downloads", async ({ set }) => {
    try {
      const list = await db
        .select()
        .from(downloads)
        .where(eq(downloads.status, "PUBLISH"))
        .all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data download" };
    }
  })
  .get("/api/downloads/admin", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const list = await db.select().from(downloads).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data download" };
    }
  })
  .post(
    "/api/downloads",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { namaFile, kategori, fileUrl, status, tanggalUpload } = body as any;
      try {
        const inserted = await db
          .insert(downloads)
          .values({
            namaFile,
            kategori,
            fileUrl,
            status: status || "PUBLISH",
            tanggalUpload:
              tanggalUpload ||
              new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            hits: 0,
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data download" };
      }
    },
    {
      body: t.Object({
        namaFile: t.String({ minLength: 1 }),
        kategori: t.String({ minLength: 1 }),
        fileUrl: t.String({ minLength: 1 }),
        status: t.Optional(t.String()),
        tanggalUpload: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/api/downloads/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { namaFile, kategori, fileUrl, status, tanggalUpload } = body as any;
      try {
        const updated = await db
          .update(downloads)
          .set({
            namaFile,
            kategori,
            fileUrl,
            status,
            tanggalUpload,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(downloads.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Data download tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data download" };
      }
    },
    {
      body: t.Object({
        namaFile: t.String({ minLength: 1 }),
        kategori: t.String({ minLength: 1 }),
        fileUrl: t.String({ minLength: 1 }),
        status: t.String(),
        tanggalUpload: t.String(),
      }),
    }
  )
  .post("/api/downloads/:id/hit", async ({ params, set }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const updated = await db
        .update(downloads)
        .set({
          hits: sql`${downloads.hits} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(downloads.id, id))
        .returning()
        .get();

      if (!updated) {
        set.status = 404;
        return { success: false, message: "Data download tidak ditemukan" };
      }

      return { success: true, data: updated };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal memperbarui jumlah unduhan" };
    }
  })
  .delete("/api/downloads/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(downloads).where(eq(downloads.id, id)).run();
      return { success: true, message: "Data download berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data download" };
    }
  })

  // --- API PRODUCTS ROUTES ---
  .get("/api/products", async ({ set }) => {
    try {
      const list = await db
        .select()
        .from(products)
        .where(eq(products.status, "AKTIF"))
        .all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data produk warga belajar" };
    }
  })
  .get("/api/products/admin", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const list = await db.select().from(products).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data produk warga belajar" };
    }
  })
  .post(
    "/api/products",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { namaProduk, deskripsi, noHp, penjual, satuan, harga, status, gambar } = body as any;
      if (harga < 0) {
        set.status = 400;
        return { success: false, message: "Harga tidak boleh bernilai negatif" };
      }

      try {
        const inserted = await db
          .insert(products)
          .values({
            namaProduk,
            deskripsi,
            noHp,
            penjual,
            satuan,
            harga,
            status: status || "AKTIF",
            gambar: gambar || "",
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data produk baru" };
      }
    },
    {
      body: t.Object({
        namaProduk: t.String(),
        deskripsi: t.String(),
        noHp: t.String(),
        penjual: t.String(),
        satuan: t.String(),
        harga: t.Numeric({ minimum: 0 }),
        status: t.Optional(t.String()),
        gambar: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/api/products/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { namaProduk, deskripsi, noHp, penjual, satuan, harga, status, gambar } = body as any;
      if (harga < 0) {
        set.status = 400;
        return { success: false, message: "Harga tidak boleh bernilai negatif" };
      }

      try {
        const updated = await db
          .update(products)
          .set({
            namaProduk,
            deskripsi,
            noHp,
            penjual,
            satuan,
            harga,
            status,
            gambar,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(products.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Data produk tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data produk" };
      }
    },
    {
      body: t.Object({
        namaProduk: t.String(),
        deskripsi: t.String(),
        noHp: t.String(),
        penjual: t.String(),
        satuan: t.String(),
        harga: t.Numeric({ minimum: 0 }),
        status: t.String(),
        gambar: t.String(),
      }),
    }
  )
  .delete("/api/products/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(products).where(eq(products.id, id)).run();
      return { success: true, message: "Data produk berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data produk" };
    }
  })

  // --- API ALUMNI ROUTES ---
  .get("/api/alumni", async ({ set }) => {
    try {
      const list = await db
        .select({
          id: alumni.id,
          nama: alumni.nama,
          program: alumni.program,
          tahunLulus: alumni.tahunLulus,
          cerita: alumni.cerita,
          foto: alumni.foto,
          createdAt: alumni.createdAt,
          updatedAt: alumni.updatedAt,
        })
        .from(alumni)
        .all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data alumni" };
    }
  })
  .get("/api/alumni/admin", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const list = await db.select().from(alumni).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data alumni" };
    }
  })
  .post(
    "/api/alumni",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const {
        nama,
        nik,
        program,
        tahunLulus,
        nisn,
        nis,
        tempatTglLahir,
        noHp,
        namaAyah,
        namaIbu,
        jenisKelamin,
        agama,
        email,
        alamat,
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        melanjutkanKe,
        pekerjaan,
        cerita,
        foto,
      } = body as any;

      try {
        const inserted = await db
          .insert(alumni)
          .values({
            nama,
            nik,
            program,
            tahunLulus,
            nisn,
            nis,
            tempatTglLahir,
            noHp,
            namaAyah,
            namaIbu,
            jenisKelamin,
            agama,
            email,
            alamat,
            rt,
            rw,
            desa,
            kecamatan,
            kabupaten,
            provinsi,
            melanjutkanKe,
            pekerjaan,
            cerita,
            foto,
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data alumni" };
      }
    },
    {
      body: t.Object({
        nama: t.String(),
        nik: t.String(),
        program: t.String(),
        tahunLulus: t.String(),
        nisn: t.String(),
        nis: t.String(),
        tempatTglLahir: t.String(),
        noHp: t.String(),
        namaAyah: t.String(),
        namaIbu: t.String(),
        jenisKelamin: t.String(),
        agama: t.String(),
        email: t.String(),
        alamat: t.String(),
        rt: t.String(),
        rw: t.String(),
        desa: t.String(),
        kecamatan: t.String(),
        kabupaten: t.String(),
        provinsi: t.String(),
        melanjutkanKe: t.String(),
        pekerjaan: t.String(),
        cerita: t.String(),
        foto: t.String(),
      }),
    }
  )
  .post(
    "/api/alumni/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const existingRecords = await db.select({ nama: alumni.nama }).from(alumni).all();
        const existingNames = new Set(existingRecords.map(e => e.nama.trim().toLowerCase()));
        const seenNamesInList = new Set<string>();

        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0 &&
            !existingNames.has(item.nama.trim().toLowerCase()) &&
            (() => {
              const normalized = item.nama.trim().toLowerCase();
              if (seenNamesInList.has(normalized)) return false;
              seenNamesInList.add(normalized);
              return true;
            })()
        );
        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < validItems.length; i += chunkSize) {
            const chunk = validItems.slice(i, i + chunkSize);
            tx.insert(alumni).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${validItems.length} data alumni`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data alumni:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data alumni" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String(),
          nik: t.String(),
          program: t.String(),
          tahunLulus: t.String(),
          nisn: t.String(),
          nis: t.String(),
          tempatTglLahir: t.String(),
          noHp: t.String(),
          namaAyah: t.String(),
          namaIbu: t.String(),
          jenisKelamin: t.String(),
          agama: t.String(),
          email: t.String(),
          alamat: t.String(),
          rt: t.String(),
          rw: t.String(),
          desa: t.String(),
          kecamatan: t.String(),
          kabupaten: t.String(),
          provinsi: t.String(),
          melanjutkanKe: t.String(),
          pekerjaan: t.String(),
          cerita: t.String(),
          foto: t.String(),
        })
      ),
    }
  )
  .put(
    "/api/alumni/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const {
        nama,
        nik,
        program,
        tahunLulus,
        nisn,
        nis,
        tempatTglLahir,
        noHp,
        namaAyah,
        namaIbu,
        jenisKelamin,
        agama,
        email,
        alamat,
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        melanjutkanKe,
        pekerjaan,
        cerita,
        foto,
      } = body as any;

      try {
        const updated = await db
          .update(alumni)
          .set({
            nama,
            nik,
            program,
            tahunLulus,
            nisn,
            nis,
            tempatTglLahir,
            noHp,
            namaAyah,
            namaIbu,
            jenisKelamin,
            agama,
            email,
            alamat,
            rt,
            rw,
            desa,
            kecamatan,
            kabupaten,
            provinsi,
            melanjutkanKe,
            pekerjaan,
            cerita,
            foto,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(alumni.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Data alumni tidak ditemukan" };
        }

        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data alumni" };
      }
    },
    {
      body: t.Object({
        nama: t.String(),
        nik: t.String(),
        program: t.String(),
        tahunLulus: t.String(),
        nisn: t.String(),
        nis: t.String(),
        tempatTglLahir: t.String(),
        noHp: t.String(),
        namaAyah: t.String(),
        namaIbu: t.String(),
        jenisKelamin: t.String(),
        agama: t.String(),
        email: t.String(),
        alamat: t.String(),
        rt: t.String(),
        rw: t.String(),
        desa: t.String(),
        kecamatan: t.String(),
        kabupaten: t.String(),
        provinsi: t.String(),
        melanjutkanKe: t.String(),
        pekerjaan: t.String(),
        cerita: t.String(),
        foto: t.String(),
      }),
    }
  )
  .delete("/api/alumni/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(alumni).where(eq(alumni.id, id)).run();
      return { success: true, message: "Data alumni berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data alumni" };
    }
  })

  // --- API GALLERY ROUTES ---
  .get("/api/gallery", async ({ set }) => {
    try {
      const list = await db
        .select()
        .from(gallery)
        .where(eq(gallery.status, "PUBLISH"))
        .all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data galeri" };
    }
  })
  .get("/api/gallery/admin", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const list = await db.select().from(gallery).all();
      return { success: true, data: list };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data galeri" };
    }
  })
  .post(
    "/api/gallery",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { namaFile, kategori, tanggalPosting, foto, status } = body as any;

      try {
        const inserted = await db
          .insert(gallery)
          .values({
            namaFile,
            kategori,
            tanggalPosting,
            foto,
            status,
          })
          .returning()
          .get();
        return { success: true, data: inserted };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data galeri" };
      }
    },
    {
      body: t.Object({
        namaFile: t.String(),
        kategori: t.String(),
        tanggalPosting: t.String(),
        foto: t.String(),
        status: t.String(),
      }),
    }
  )
  .put(
    "/api/gallery/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID tidak valid" };
      }

      const { namaFile, kategori, tanggalPosting, foto, status } = body as any;

      try {
        const updated = await db
          .update(gallery)
          .set({
            namaFile,
            kategori,
            tanggalPosting,
            foto,
            status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(gallery.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Data galeri tidak ditemukan" };
        }
        return { success: true, data: updated };
      } catch (err) { console.error("CMS error:", err);
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data galeri" };
      }
    },
    {
      body: t.Object({
        namaFile: t.String(),
        kategori: t.String(),
        tanggalPosting: t.String(),
        foto: t.String(),
        status: t.String(),
      }),
    }
  )
  .delete("/api/gallery/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID tidak valid" };
    }

    try {
      await db.delete(gallery).where(eq(gallery.id, id)).run();
      return { success: true, message: "Data galeri berhasil dihapus" };
    } catch (err) { console.error("CMS error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus data galeri" };
    }
  });
