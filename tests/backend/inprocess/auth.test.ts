import { describe, expect, test } from "bun:test";
import { api, login, signToken } from "../helpers/in-process-app";
import { createManager, createStudent, createTutor, removeManager } from "../helpers/db-fixtures";

describe("auth in-process", () => {
  test("manager, tutor, dan siswa aktif dapat login", async () => {
    const manager = await createManager({ plainPassword: "manager-pass" });
    const tutor = await createTutor({ plainPassword: "tutor-pass" });
    const student = await createStudent({ plainPassword: "student-pass" });

    for (const [email, password, role] of [
      [manager.email, "manager-pass", "super_admin"],
      [tutor.email, "tutor-pass", "tutor"],
      [student.email, "student-pass", "siswa"],
    ]) {
      const { response, data } = await api<any>("/api/auth/login", {
        method: "POST",
        json: { username: email, password },
      });
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe(role);
      expect(data.token).toBeString();
    }
  });

  test("kredensial salah dan siswa nonaktif ditolak", async () => {
    const active = await createStudent({ plainPassword: "correct-pass" });
    const inactive = await createStudent({ plainPassword: "inactive-pass", status: "LULUS" });

    const wrong = await api<any>("/api/auth/login", {
      method: "POST",
      json: { username: active.email, password: "wrong" },
    });
    expect(wrong.response.status).toBe(401);
    expect(wrong.data.message).toContain("salah");

    const blocked = await api<any>("/api/auth/login", {
      method: "POST",
      json: { username: inactive.email, password: "inactive-pass" },
    });
    expect(blocked.response.status).toBe(403);
    expect(blocked.data.message).toContain("tidak aktif");
  });

  test("/me memerlukan token yang valid dan akun yang masih ada", async () => {
    const missing = await api<any>("/api/auth/me");
    expect(missing.response.status).toBe(401);

    const malformed = await api<any>("/api/auth/me", { token: "not-a-jwt" });
    expect(malformed.response.status).toBe(401);

    const manager = await createManager({ plainPassword: "profile-pass" });
    const token = await login(manager.email, "profile-pass");
    const profile = await api<any>("/api/auth/me", { token });
    expect(profile.response.status).toBe(200);
    expect(profile.data.user.email).toBe(manager.email);
    expect(profile.data.user.password).toBeUndefined();

    await removeManager(manager.id);
    const deleted = await api<any>("/api/auth/me", { token });
    expect(deleted.response.status).toBe(404);
  });

  test("/me mencakup tutor, siswa aktif/nonaktif, dan akun hilang", async () => {
    const tutor = await createTutor({ plainPassword: "me-tutor" });
    const tutorToken = await login(tutor.email, "me-tutor");
    const tutorMe = await api<any>("/api/auth/me", { token: tutorToken });
    expect(tutorMe.response.status).toBe(200);
    expect(tutorMe.data.user.role).toBe("tutor");

    const student = await createStudent({ plainPassword: "me-siswa", status: "AKTIF" });
    const studentToken = await login(student.email, "me-siswa");
    const studentMe = await api<any>("/api/auth/me", { token: studentToken });
    expect(studentMe.response.status).toBe(200);
    expect(studentMe.data.user.role).toBe("siswa");

    // Siswa dinonaktifkan setelah login → /me 403
    const { db } = await import("../helpers/in-process-app");
    const { students } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    await db.update(students).set({ status: "LULUS" }).where(eq(students.id, student.id)).run();
    expect((await api("/api/auth/me", { token: studentToken })).response.status).toBe(403);

    // Tutor dihapus setelah login → /me 404
    const { tutors } = await import("../../../src/server/models");
    await db.delete(tutors).where(eq(tutors.id, tutor.id)).run();
    expect((await api("/api/auth/me", { token: tutorToken })).response.status).toBe(404);

    // Siswa dihapus setelah login → /me 404
    await db.delete(students).where(eq(students.id, student.id)).run();
    const ghostToken = await signToken({
      id: student.id,
      username: student.email,
      role: "siswa",
      name: student.nama,
      email: student.email,
    });
    expect((await api("/api/auth/me", { token: ghostToken })).response.status).toBe(404);
  });

  test("update-profile per role, 404, dan role asing", async () => {
    const manager = await createManager({ plainPassword: "upd-admin" });
    const adminToken = await login(manager.email, "upd-admin");
    const updAdmin = await api<any>("/api/auth/update-profile", {
      method: "PUT",
      token: adminToken,
      json: { name: "Admin Baru", jabatan: "Ketua", password: "baru12345" },
    });
    expect(updAdmin.response.status).toBe(200);
    expect(updAdmin.data.user.name).toBe("Admin Baru");
    // Password baru bisa dipakai login
    expect(await login(manager.email, "baru12345")).toBeString();

    const tutor = await createTutor({ plainPassword: "upd-tutor" });
    const tutorToken = await login(tutor.email, "upd-tutor");
    const updTutor = await api<any>("/api/auth/update-profile", {
      method: "PUT",
      token: tutorToken,
      json: { name: "Tutor Baru", foto: "/api/files/foto-baru.png" },
    });
    expect(updTutor.response.status).toBe(200);

    const student = await createStudent({ plainPassword: "upd-siswa" });
    const studentToken = await login(student.email, "upd-siswa");
    const updStudent = await api<any>("/api/auth/update-profile", {
      method: "PUT",
      token: studentToken,
      json: { name: "Siswa Baru", noHp: "081", namaAyah: "Ayah" },
    });
    expect(updStudent.response.status).toBe(200);

    // Token untuk akun yang sudah dihapus → 404
    await removeManager(manager.id);
    expect(
      (await api("/api/auth/update-profile", { method: "PUT", token: adminToken, json: { name: "x" } }))
        .response.status,
    ).toBe(404);

    // Tanpa token → 401; role asing → 400
    expect((await api("/api/auth/update-profile", { method: "PUT", json: { name: "x" } })).response.status).toBe(401);
    const alien = await signToken({
      id: 1,
      username: "a@t.l",
      role: "alien",
      name: "A",
      email: "a@t.l",
    });
    expect(
      (await api("/api/auth/update-profile", { method: "PUT", token: alien, json: { name: "x" } })).response.status,
    ).toBe(400);
  });

  test("reset-password matrix: admin/tutor/siswa, 403, 404, 400", async () => {
    const admin = await createManager({ plainPassword: "reset-admin", role: "super_admin" });
    const adminToken = await login(admin.email, "reset-admin");
    const tutor = await createTutor({ plainPassword: "reset-tutor" });
    const student = await createStudent({ plainPassword: "reset-siswa" });

    for (const [role, id, email, pw] of [
      ["manager", admin.id, admin.email, "new-admin-pw"],
      ["tutor", tutor.id, tutor.email, "new-tutor-pw"],
      ["siswa", student.id, student.email, "new-siswa-pw"],
    ] as [string, number, string, string][]) {
      const res = await api<any>("/api/admin/reset-password", {
        method: "POST",
        token: adminToken,
        json: { targetRole: role, targetId: id, newPassword: pw },
      });
      expect(res.response.status).toBe(200);
      expect(await login(email, pw)).toBeString();
    }

    // Non-super_admin ditolak 403
    const tutorToken = await login(tutor.email, "new-tutor-pw");
    expect(
      (
        await api("/api/admin/reset-password", {
          method: "POST",
          token: tutorToken,
          json: { targetRole: "siswa", targetId: student.id, newPassword: "x123456" },
        })
      ).response.status,
    ).toBe(403);
    // Tanpa token 401; target hilang 404; role asing 400
    expect(
      (
        await api("/api/admin/reset-password", {
          method: "POST",
          json: { targetRole: "siswa", targetId: student.id, newPassword: "x123456" },
        })
      ).response.status,
    ).toBe(401);
    expect(
      (
        await api("/api/admin/reset-password", {
          method: "POST",
          token: adminToken,
          json: { targetRole: "siswa", targetId: 999999, newPassword: "x123456" },
        })
      ).response.status,
    ).toBe(404);
    expect(
      (
        await api("/api/admin/reset-password", {
          method: "POST",
          token: adminToken,
          json: { targetRole: "alien", targetId: 1, newPassword: "x123456" },
        })
      ).response.status,
    ).toBe(400);
  });

  test("hash kosong/korup tidak menggagalkan login (safeVerify)", async () => {
    const { db } = await import("../helpers/in-process-app");
    const { managers, tutors } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");

    // Manager dengan password kosong → jatuh ke DUMMY_HASH, 401 tanpa throw
    const emptyHash = await createManager({ plainPassword: "x", password: "" });
    const r1 = await api<any>("/api/auth/login", {
      method: "POST",
      json: { username: emptyHash.email, password: "apapun" },
    });
    expect(r1.response.status).toBe(401);

    // Tutor dengan hash korup → catch safeVerify, 401 tanpa throw
    const corrupt = await createTutor({ plainPassword: "x", password: "bukan-hash-valid" });
    const r2 = await api<any>("/api/auth/login", {
      method: "POST",
      json: { username: corrupt.email, password: "apapun" },
    });
    expect(r2.response.status).toBe(401);
    await db.delete(managers).where(eq(managers.id, emptyHash.id)).run();
    await db.delete(tutors).where(eq(tutors.id, corrupt.id)).run();
  });

  test("reset-password 404 per role (manager/tutor hilang)", async () => {
    const admin = await createManager({ plainPassword: "reset404", role: "super_admin" });
    const adminToken = await login(admin.email, "reset404");
    for (const role of ["manager", "tutor"]) {
      const res = await api<any>("/api/admin/reset-password", {
        method: "POST",
        token: adminToken,
        json: { targetRole: role, targetId: 999999, newPassword: "x123456" },
      });
      expect(res.response.status).toBe(404);
    }
  });

  test("update-profile 404 tutor/siswa hilang + token basi", async () => {
    const tutor = await createTutor({ plainPassword: "upd404t" });
    const tutorToken = await login(tutor.email, "upd404t");
    const { db } = await import("../helpers/in-process-app");
    const { tutors, students } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    await db.delete(tutors).where(eq(tutors.id, tutor.id)).run();
    expect(
      (await api("/api/auth/update-profile", { method: "PUT", token: tutorToken, json: { name: "x" } }))
        .response.status,
    ).toBe(404);

    const student = await createStudent({ plainPassword: "upd404s" });
    const studentToken = await login(student.email, "upd404s");
    await db.delete(students).where(eq(students.id, student.id)).run();
    expect(
      (await api("/api/auth/update-profile", { method: "PUT", token: studentToken, json: { name: "x" } }))
        .response.status,
    ).toBe(404);

    // Token basi di update-profile → 401 (baris 302-303)
    expect(
      (await api("/api/auth/update-profile", { method: "PUT", token: "not-a-jwt", json: { name: "x" } }))
        .response.status,
    ).toBe(401);
  });

  test("update-profile siswa keep foto yang dipakai alumni", async () => {
    const { db } = await import("../helpers/in-process-app");
    const { students, alumni } = await import("../../../src/server/models");
    const student = await createStudent({
      plainPassword: "keep-foto",
      foto: "/api/files/shared-foto.png",
    });
    await db.insert(alumni).values({ nama: "Alumni Keep", foto: "/api/files/shared-foto.png" }).run();
    const studentToken = await login(student.email, "keep-foto");
    const res = await api<any>("/api/auth/update-profile", {
      method: "PUT",
      token: studentToken,
      json: { foto: "/api/files/foto-baru.png" },
    });
    expect(res.response.status).toBe(200);
    expect(res.data.user.foto).toBe("/api/files/foto-baru.png");
    const { eq } = await import("drizzle-orm");
    await db.delete(students).where(eq(students.id, student.id)).run();
  });

  test("token kedaluwarsa dan role asing ditolak secara aman", async () => {
    const expired = await signToken({
      id: 1,
      username: "expired@test.local",
      role: "admin",
      name: "Expired",
      email: "expired@test.local",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    expect((await api("/api/auth/me", { token: expired })).response.status).toBe(401);

    const unknown = await signToken({
      id: 1,
      username: "unknown@test.local",
      role: "unknown",
      name: "Unknown",
      email: "unknown@test.local",
    });
    const result = await api<any>("/api/auth/me", { token: unknown });
    expect([400, 401, 403, 404]).toContain(result.response.status);
  });
});
