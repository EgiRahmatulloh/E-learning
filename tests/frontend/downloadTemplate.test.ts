// Uji unit untuk downloadFromTemplate di src/lib/downloadTemplate.ts —
// unduhan laporan xlsx dari endpoint template server.
// toast sonner di-mock agar tidak butuh React; DOM (URL/document) di-stub
// karena Bun test tidak punya browser.
// Jalankan: bun run test:fe
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const toastError = mock(() => {});
const toastSuccess = mock(() => {});
mock.module("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

const { downloadFromTemplate } = await import("../../src/lib/downloadTemplate");

type Harness = {
  clicks: number;
  appended: unknown[];
  revoked: string[];
  setToken: (t: string | null) => void;
  respondSpreadsheet: (bytes?: number[]) => void;
  respondErrorJson: (status: number, message: string) => void;
  respondWrongContentType: (text: string) => void;
};

function installHarness(): Harness {
  const h: Harness = {
    clicks: 0,
    appended: [],
    revoked: [],
    setToken(token: string | null) {
      const store = new Map<string, string>();
      if (token !== null) store.set("token", token);
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: { getItem: (k: string) => store.get(k) ?? null },
      });
    },
    respondSpreadsheet() {},
    respondErrorJson() {},
    respondWrongContentType() {},
  };

  const g = globalThis as Record<string, unknown>;
  g.URL = {
    createObjectURL: (_blob: Blob) => "blob:mock-url",
    revokeObjectURL: (url: string) => {
      h.revoked.push(url);
    },
  };
  const fakeAnchor = {
    href: "",
    download: "",
    click: () => {
      h.clicks++;
    },
  };
  g.document = {
    createElement: (_tag: string) => fakeAnchor,
    body: {
      appendChild: (el: unknown) => {
        h.appended.push(el);
      },
      removeChild: (_el: unknown) => {},
    },
  };

  return h;
}

let h: Harness;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  h = installHarness();
  h.setToken("token-valid");
  toastError.mockClear();
  toastSuccess.mockClear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("downloadFromTemplate", () => {
  test("tanpa token: toast sesi berakhir, tanpa request jaringan", async () => {
    h.setToken(null);
    let fetched = false;
    globalThis.fetch = (async () => {
      fetched = true;
      return new Response("x");
    }) as unknown as typeof fetch;

    await downloadFromTemplate("/api/laporan/x", "lap.xlsx");

    expect(fetched).toBe(false);
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0][0])).toMatch(/Sesi/i);
  });

  test("berhasil: kirim Authorization, klik anchor unduhan, toast sukses", async () => {
    let authHeader = "";
    const bytes = new Uint8Array([1, 2, 3, 4]);
    globalThis.fetch = (async (_url: string, init: { headers: Record<string, string> }) => {
      authHeader = init.headers.Authorization;
      return new Response(bytes, {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }) as unknown as typeof fetch;

    await downloadFromTemplate("/api/laporan/x", "lap.xlsx");

    expect(authHeader).toBe("Bearer token-valid");
    expect(h.clicks).toBe(1);
    expect(h.appended).toHaveLength(1);
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(String(toastSuccess.mock.calls[0][0])).toContain("lap.xlsx");
  });

  test("respons error JSON menampilkan pesan server", async () => {
    globalThis.fetch = (async () =>
      Response.json({ message: "Data kosong" }, { status: 404 })) as unknown as typeof fetch;

    await downloadFromTemplate("/api/laporan/x", "lap.xlsx");

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0][0])).toMatch(/Gagal mengunduh/);
    const desc = String(
      (toastError.mock.calls[0][1] as { description?: string })?.description ?? "",
    );
    expect(desc).toContain("Data kosong");
    expect(h.clicks).toBe(0);
  });

  test("content-type tak dikenal (error 200) ditolak sebelum unduh", async () => {
    globalThis.fetch = (async () =>
      new Response('{"success":false}', {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    await downloadFromTemplate("/api/laporan/x", "lap.xlsx");

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(h.clicks).toBe(0);
  });

  test("application/octet-stream diterima sebagai spreadsheet", async () => {
    globalThis.fetch = (async () =>
      new Response(new Uint8Array([9]), {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      })) as unknown as typeof fetch;

    await downloadFromTemplate("/api/laporan/x", "lap.xlsx");

    expect(h.clicks).toBe(1);
    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });

  test("jaringan mati menampilkan toast gagal, tanpa lempar", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    await expect(
      downloadFromTemplate("/api/laporan/x", "lap.xlsx"),
    ).resolves.toBeUndefined();
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(h.clicks).toBe(0);
  });
});
