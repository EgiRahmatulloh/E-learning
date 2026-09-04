// Uji unit untuk src/lib/upload.ts — helper ini dipakai ~20 komponen, jadi
// perilaku error-nya (offline vs ditolak server) perlu dijaga.
// Jalankan: bun test
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  commitUploads,
  discardUpload,
  isNetworkError,
  MAX_IMAGE_SIZE,
  pickImageFiles,
  uploadFile,
  UploadError,
  uploadFiles,
  validateImageFile,
} from "../src/lib/upload";

const originalFetch = globalThis.fetch;
let calls: { url: string; body: FormData }[] = [];

function setToken(token: string | null) {
  const store = new Map<string, string>();
  if (token !== null) store.set("token", token);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: { getItem: (k: string) => store.get(k) ?? null },
  });
}

function mockFetch(impl: () => Response | Promise<Response>) {
  calls = [];
  globalThis.fetch = ((url: string, init: { body: FormData }) => {
    calls.push({ url: String(url), body: init.body });
    return Promise.resolve(impl());
  }) as unknown as typeof fetch;
}

function imageFile(name = "foto.png", bytes = 8) {
  return new File([new Uint8Array(bytes)], name, { type: "image/png" });
}

beforeEach(() => setToken("token-valid"));
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("validasi", () => {
  test("menolak berkas non-gambar", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(validateImageFile(pdf)).toBe("Hanya berkas gambar yang diperbolehkan!");
  });

  test("menolak gambar di atas 5MB", () => {
    const big = imageFile("besar.png", MAX_IMAGE_SIZE + 1);
    expect(validateImageFile(big)).toBe("Ukuran gambar melebihi batas 5MB!");
  });

  test("meloloskan gambar yang wajar", () => {
    expect(validateImageFile(imageFile())).toBeNull();
  });

  test("pickImageFiles menolak seluruh batch bila ada satu yang kelewat besar", () => {
    const result = pickImageFiles([imageFile(), imageFile("besar.png", MAX_IMAGE_SIZE + 1)]);
    expect(result.images).toHaveLength(0);
    expect(result.error).toBe("Ukuran gambar melebihi batas 5MB!");
  });

  test("pickImageFiles menyaring berkas non-gambar", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    const result = pickImageFiles([imageFile(), pdf]);
    expect(result.error).toBeNull();
    expect(result.images.map((f) => f.name)).toEqual(["foto.png"]);
  });

  test("pickImageFiles menolak bila tidak ada gambar sama sekali", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(pickImageFiles([pdf]).error).toBe("Hanya berkas gambar yang diperbolehkan!");
  });
});

describe("uploadFile", () => {
  test("mengembalikan URL dari server", async () => {
    mockFetch(() => Response.json({ success: true, url: "/api/files/foto.png" }));
    expect(await uploadFile(imageFile())).toBe("/api/files/foto.png");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/upload");
  });

  test("tidak mengirim flag apa pun secara default", async () => {
    mockFetch(() => Response.json({ success: true, url: "/x.png" }));
    await uploadFile(imageFile());
    expect(calls[0].body.get("private")).toBeNull();
    expect(calls[0].body.get("public")).toBeNull();
  });

  test("menandai berkas privat", async () => {
    mockFetch(() => Response.json({ success: true, url: "/priv-x.pdf" }));
    await uploadFile(imageFile(), { visibility: "private" });
    expect(calls[0].body.get("private")).toBe("true");
    expect(calls[0].body.get("public")).toBeNull();
  });

  test("menandai berkas publik", async () => {
    mockFetch(() => Response.json({ success: true, url: "/pub-x.pdf" }));
    await uploadFile(imageFile(), { visibility: "public" });
    expect(calls[0].body.get("public")).toBe("true");
    expect(calls[0].body.get("private")).toBeNull();
  });

  test("menolak tanpa token tanpa menyentuh jaringan", async () => {
    setToken(null);
    mockFetch(() => Response.json({ success: true, url: "/x.png" }));
    const err = (await uploadFile(imageFile()).catch((e) => e)) as UploadError;
    expect(err).toBeInstanceOf(UploadError);
    expect(err.kind).toBe("auth");
    expect(calls).toHaveLength(0);
  });
});

describe("pembedaan sebab kegagalan", () => {
  test("koneksi gagal ditandai network — dipakai fallback base64 offline", async () => {
    mockFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    const err = (await uploadFile(imageFile()).catch((e) => e)) as UploadError;
    expect(err.kind).toBe("network");
    expect(isNetworkError(err)).toBe(true);
  });

  test("penolakan server TIDAK dianggap masalah jaringan", async () => {
    mockFetch(() =>
      Response.json({ success: false, message: "Ekstensi berkas tidak diperbolehkan" }, { status: 400 }),
    );
    const err = (await uploadFile(imageFile()).catch((e) => e)) as UploadError;
    expect(err.kind).toBe("server");
    expect(err.message).toBe("Ekstensi berkas tidak diperbolehkan");
    expect(isNetworkError(err)).toBe(false);
  });

  test("401 ditandai auth", async () => {
    mockFetch(() => Response.json({ success: false, message: "Akses ditolak" }, { status: 401 }));
    const err = (await uploadFile(imageFile()).catch((e) => e)) as UploadError;
    expect(err.kind).toBe("auth");
  });

  test("respons bukan JSON tetap memberi pesan yang jelas", async () => {
    mockFetch(() => new Response("<html>Bad Gateway</html>", { status: 502 }));
    const err = (await uploadFile(imageFile()).catch((e) => e)) as UploadError;
    expect(err).toBeInstanceOf(UploadError);
    expect(err.message).toContain("502");
  });

  test("pembatalan diteruskan apa adanya, bukan disamarkan jadi network", async () => {
    mockFetch(() => {
      throw new DOMException("Aborted", "AbortError");
    });
    const err = (await uploadFile(imageFile()).catch((e) => e)) as DOMException;
    expect(err).toBeInstanceOf(DOMException);
    expect(err.name).toBe("AbortError");
  });
});

describe("uploadFiles", () => {
  test("melewati berkas yang ditolak server dan melanjutkan sisanya", async () => {
    let n = 0;
    mockFetch(() => {
      n++;
      return n === 2
        ? Response.json({ success: false, message: "Ekstensi ditolak" }, { status: 400 })
        : Response.json({ success: true, url: `/foto-${n}.png` });
    });

    const uploaded: string[] = [];
    const failed: string[] = [];
    const urls = await uploadFiles([imageFile("a.png"), imageFile("b.png"), imageFile("c.png")], {
      onUploaded: (url) => uploaded.push(url),
      onFailed: (message) => failed.push(message),
    });

    expect(urls).toEqual(["/foto-1.png", "/foto-3.png"]);
    expect(uploaded).toEqual(["/foto-1.png", "/foto-3.png"]);
    expect(failed).toEqual(["Ekstensi ditolak"]);
  });

  test("berhenti saat koneksi mati, tanpa mencoba berkas berikutnya", async () => {
    let n = 0;
    mockFetch(() => {
      n++;
      if (n === 2) throw new TypeError("Failed to fetch");
      return Response.json({ success: true, url: `/foto-${n}.png` });
    });

    const uploaded: string[] = [];
    const err = await uploadFiles([imageFile(), imageFile(), imageFile()], {
      onUploaded: (url) => uploaded.push(url),
    }).catch((e) => e);

    expect(isNetworkError(err)).toBe(true);
    // Berkas pertama sudah masuk state pemanggil, berkas ketiga tidak dicoba
    expect(uploaded).toEqual(["/foto-1.png"]);
    expect(calls).toHaveLength(2);
  });
});

describe("pembuangan berkas yang batal dipakai", () => {
  // Hapus registry token di antara tes supaya state tidak bocor antar tes.
  let deletes: { url: string; method: string }[] = [];
  const deleteUrls = () => deletes.map((d) => d.url);

  beforeEach(() => {
    deletes = [];
    globalThis.fetch = ((url: string, init?: { method?: string }) => {
      const u = String(url);
      if (u.includes("/api/files/") && init?.method === "DELETE") {
        deletes.push({ url: u, method: "DELETE" });
        return Promise.resolve(Response.json({ success: true }));
      }
      return Promise.resolve(Response.json({ success: true, url: "/baru.png", deleteToken: "tok" }));
    }) as unknown as typeof fetch;
  });

  // Registry di-reset antar tes lewat module caching — tidak ada setter publik;
  // simulasi "belum pernah upload" lewat URL tanpa token cukup.
  test("discardUpload hanya menghapus berkas yang benar-benar diunggah sebelumnya", async () => {
    await discardUpload("/api/files/priv-abc.png"); // tanpa token → tidak ada DELETE
    expect(deletes).toHaveLength(0);
  });

  test("commit sebelum discard menjaga berkas yang sudah tersimpan di DB", async () => {
    await uploadFile(imageFile()); // daftarkan "/baru.png" + token di registry
    commitUploads("/baru.png");
    await discardUpload("/baru.png");
    expect(deleteUrls()).not.toContain("/api/files/baru.png");
  });
});
