export function createMockR2(): R2Bucket {
  const store = new Map<string, Uint8Array>();

  const mock = {
    async put(key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob | null) {
      if (value === null) {
        store.set(key, new Uint8Array());
      } else if (typeof value === "string") {
        store.set(key, new TextEncoder().encode(value));
      } else if (value instanceof Uint8Array) {
        store.set(key, new Uint8Array(value));
      } else if (ArrayBuffer.isView(value)) {
        store.set(key, new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)));
      } else if (value instanceof ArrayBuffer) {
        store.set(key, new Uint8Array(value));
      } else {
        throw new Error("Unsupported mock R2 value");
      }
      return { key, size: store.get(key)!.byteLength } as R2Object;
    },
    async get(key: string) {
      const data = store.get(key);
      if (!data) return null;
      return {
        key,
        size: data.byteLength,
        async arrayBuffer() {
          return data.slice().buffer;
        },
      } as unknown as R2ObjectBody;
    },
    async delete(keys: string | string[]) {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const key of list) store.delete(key);
    },
    async list(options?: R2ListOptions) {
      const prefix = options?.prefix || "";
      const objects = [...store.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, bytes]) => ({ key, size: bytes.byteLength }) as R2Object);
      return { objects, truncated: false, delimitedPrefixes: [] } as unknown as R2Objects;
    },
  };

  return mock as unknown as R2Bucket;
}
