/* eslint-disable @typescript-eslint/no-explicit-any */
export const verifyAdmin = async (
  headers: Record<string, string | undefined>,
  jwt: any,
  set: any
) => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }

  const token = authHeader.split(" ")[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { success: false, message: "Sesi Anda telah kedaluwarsa, silakan masuk kembali" };
  }

  if (payload.role !== "admin" && payload.role !== "super_admin") {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

  return null; // Valid
};

export const getAdminPayload = async (
  headers: Record<string, string | undefined>,
  jwt: any
) => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return await jwt.verify(token);
};
