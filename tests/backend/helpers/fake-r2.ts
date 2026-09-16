export interface FakeR2Options {
  failWrite?: boolean;
  failRead?: boolean;
  failDelete?: boolean;
}

export function createFakeR2(options: FakeR2Options = {}) {
  const files = new Map<string, Uint8Array>();
  const deleted: string[] = [];

  const client = {
    file(name: string) {
      return {
        async write(value: Blob | ArrayBuffer | Uint8Array | string) {
          if (options.failWrite) throw new Error("fake R2 write failure");
          const bytes =
            typeof value === "string"
              ? new TextEncoder().encode(value)
              : value instanceof Blob
                ? new Uint8Array(await value.arrayBuffer())
                : value instanceof ArrayBuffer
                  ? new Uint8Array(value)
                  : value;
          files.set(name, bytes);
        },
        async exists() {
          return files.has(name);
        },
        async arrayBuffer() {
          if (options.failRead) throw new Error("fake R2 read failure");
          const bytes = files.get(name);
          if (!bytes) throw new Error("fake R2 file missing");
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
        stream() {
          if (options.failRead) throw new Error("fake R2 read failure");
          const bytes = files.get(name);
          if (!bytes) return null;
          return new Blob([bytes]).stream();
        },
        async delete() {
          if (options.failDelete) throw new Error("fake R2 delete failure");
          deleted.push(name);
          files.delete(name);
        },
      };
    },
  };

  return {
    client,
    files,
    deleted,
    put(name: string, value: string | Uint8Array) {
      files.set(name, typeof value === "string" ? new TextEncoder().encode(value) : value);
    },
  };
}
