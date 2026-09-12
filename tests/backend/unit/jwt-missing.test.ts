import { describe, expect, test } from "bun:test";

const missingJwtSuite = Bun.env.BACKEND_TEST_ALLOW_MISSING_JWT === "1" ? describe : describe.skip;

missingJwtSuite("JWT configuration without a secret", () => {
  test("fails fast during module import", async () => {
    expect(Bun.env.JWT_SECRET).toBeFalsy();
    await expect(import("../../../src/server/config/jwt")).rejects.toThrow("JWT_SECRET");
  });
});
