import { eq } from "drizzle-orm";
import { db, models } from "./in-process-app";

let serial = 0;
const unique = (prefix: string) => `${prefix}-${Date.now()}-${serial++}@test.local`;

export async function createManager(
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const password = String(overrides.plainPassword ?? "Admin123!");
  return db
    .insert(models.managers)
    .values({
      nama: "Admin Test",
      email: unique("admin"),
      password: await Bun.password.hash(password),
      role: "super_admin",
      ...overrides,
      plainPassword: undefined,
    } as any)
    .returning()
    .get();
}

export async function createTutor(
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const password = String(overrides.plainPassword ?? "Tutor123!");
  return db
    .insert(models.tutors)
    .values({
      nama: "Tutor Test",
      email: unique("tutor"),
      password: await Bun.password.hash(password),
      tutorMapel: "Matematika",
      program: "PAKET C",
      ...overrides,
      plainPassword: undefined,
    } as any)
    .returning()
    .get();
}

export async function createStudent(
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const password = String(overrides.plainPassword ?? "Siswa123!");
  return db
    .insert(models.students)
    .values({
      nama: "Siswa Test",
      email: unique("student"),
      password: await Bun.password.hash(password),
      program: "PAKET C",
      kelas: "PAKET C 10 A",
      status: "AKTIF",
      ...overrides,
      plainPassword: undefined,
    } as any)
    .returning()
    .get();
}

export async function createRombel(
  overrides: Record<string, unknown> = {},
): Promise<any> {
  return db
    .insert(models.rombels)
    .values({ nama: `PAKET C 10 ${String.fromCharCode(65 + (serial++ % 20))}`, ...overrides } as any)
    .returning()
    .get();
}

export async function assignStudent(rombelId: number, studentId: number) {
  await db.insert(models.rombelStudents).values({ rombelId, studentId }).run();
}

export async function createCourse(
  overrides: Record<string, unknown> = {},
): Promise<any> {
  return db
    .insert(models.elearningCourses)
    .values({
      namaMapel: `Mapel Test ${serial++}`,
      program: "PAKET C",
      kelas: "10",
      ...overrides,
    } as any)
    .returning()
    .get();
}

export async function createSession(courseId: number, overrides: Record<string, unknown> = {}) {
  return db
    .insert(models.elearningSessions)
    .values({ courseId, sessionNumber: 1, title: "Pertemuan 1", ...overrides } as any)
    .returning()
    .get();
}

export async function removeManager(id: number) {
  await db.delete(models.managers).where(eq(models.managers.id, id)).run();
}
