// Helper bersama untuk integration test live-server (bun test tests/live-*.test.ts).
// Pola: login sekali per file → simpan token admin; tiap test yang menulis data
// memakai nama unik berprefix IT-TEST- + timestamp agar idempoten (aman
// dijalankan ulang), lalu bersih-bersih (DELETE) di akhir test.
//
// Prasyarat: server jalan di BASE_URL (default http://localhost:3000) dengan
// kredensial seed admin@pkbmmakmur.org / admin123. Bila server mati, seluruh
// test di file live-* gagal eksplisit dengan pesan yang jelas (fail-fast),
// bukan timeout menggantung.
import { expect } from "bun:test";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
export const ADMIN_USER = process.env.IT_ADMIN_USER ?? "admin@pkbmmakmur.org";
export const ADMIN_PASS = process.env.IT_ADMIN_PASS ?? "admin123";

// Nama unik per test-run: isolasi antar run & antar test.
export const tag = (name: string) => `IT-TEST-${name}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

export async function api(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch (err) {
    throw new Error(
      `Server tidak terjangkau di ${BASE_URL} — jalankan dulu (bun run dev / bun start). Penyebab: ${err}`,
    );
  }
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // bukan JSON (mis. binary xlsx) → kembalikan teks mentah
  }
  return { status: res.status, body };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function loginAdmin(): Promise<string> {
  const { status, body } = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  expect(status).toBe(200);
  const token = (body as { token?: string })?.token;
  expect(token).toBeString();
  return token as string;
}

/** Ambil id dari respons create { success, data: { id } }. */
export function createdId(res: { status: number; body: unknown }): number {
  expect(res.status).toBe(200);
  const id = (res.body as { data?: { id?: number } })?.data?.id;
  expect(id).toBeNumber();
  return id as number;
}
