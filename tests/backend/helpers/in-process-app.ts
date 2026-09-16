if (!Bun.env.JWT_SECRET) {
  Bun.env.JWT_SECRET = "backend-inprocess-test-secret";
}
Bun.env.NODE_ENV = "test";
Bun.env.DATABASE_URL = ":memory:";

const { createApp } = await import("../../../src/server/app");
const { db } = await import("../../../src/server/config/db");
const models = await import("../../../src/server/models");

export const app = createApp({ isProd: false });
export { db, models };

export interface ApiResponse<T = unknown> {
  response: Response;
  data: T;
}

export async function api<T = any>(
  path: string,
  init: RequestInit & { json?: unknown; token?: string } = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  let body = init.body;
  if ("json" in init) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }

  const response = await app.fetch(
    new Request(`http://in-process.test${path}`, { ...init, headers, body }),
  );
  const text = await response.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    data = text as T;
  }
  return { response, data };
}

export async function apiBytes(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<{ response: Response; data: Uint8Array }> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  const response = await app.fetch(
    new Request(`http://in-process.test${path}`, { ...init, headers }),
  );
  return { response, data: new Uint8Array(await response.arrayBuffer()) };
}

export async function login(username: string, password: string): Promise<string> {
  const { response, data } = await api<{ token?: string; message?: string }>(
    "/api/auth/login",
    { method: "POST", json: { username, password } },
  );
  if (!response.ok || !data.token) {
    throw new Error(`Login fixture gagal (${response.status}): ${data.message ?? "tanpa token"}`);
  }
  return data.token;
}

export async function signToken(payload: {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string;
  exp?: number;
}): Promise<string> {
  const { jwt } = await import("@elysia/jwt");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const testApp = new (await import("elysia")).Elysia()
    .use(signer)
    .get("/", ({ jwt }) => jwt.sign(payload));
  const response = await testApp.handle(new Request("http://token.test/"));
  return response.text();
}
