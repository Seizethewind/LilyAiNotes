declare module "node:module" {
  export function createRequire(url: string | URL): (id: string) => unknown;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf-8"): string;
}

declare module "node:path" {
  export function resolve(...segments: string[]): string;
}
