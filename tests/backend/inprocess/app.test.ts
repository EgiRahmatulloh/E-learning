import { describe, expect, test } from "bun:test";
import { api } from "../helpers/in-process-app";

describe("createApp composition", () => {
  test("melayani hello dengan header keamanan", async () => {
    const { response, data } = await api<{ message: string; status: string }>("/api/hello", {
      headers: { origin: "https://frontend.test" },
    });

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "Hello from Elysia!", status: "Connected" });
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://frontend.test");
  });

  test("mengembalikan 404 plain text untuk route yang tidak ada", async () => {
    const { response, data } = await api<string>("/api/tidak-ada");
    expect(response.status).toBe(404);
    expect(data).toBe("Not Found");
  });

  test("endpoint file dapat di-frame hanya dari origin yang sama", async () => {
    const { response } = await api("/api/files/tidak-ada.png");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
});
