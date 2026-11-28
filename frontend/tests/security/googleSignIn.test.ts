// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import * as callback from "../../functions/api/v1/auth/google/callback";
import * as start from "../../functions/api/v1/auth/google/start";
import * as login from "../../functions/api/v1/auth/login";
import * as me from "../../functions/api/v1/auth/me";
import * as register from "../../functions/api/v1/auth/register";
import { describeGoogleError } from "../../app/utils/describeGoogleError";
import { createSessionToken } from "../../functions/_lib/crypto/createSessionToken";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

const BASE = "https://lily.example.com/api/v1/auth/google";
const SECRET = "test-secret-key-at-least-32-bytes";
const buildEnv = (): Env => ({
  DB: createMockD1(),
  APP_SECRET_KEY: SECRET,
  COOKIE_SECURE: "true",
  GOOGLE_CLIENT_ID: "client-1",
  GOOGLE_CLIENT_SECRET: "shh",
});

async function runFlow(env: Env, claims: Record<string, unknown> = {}, options: { session?: string; state?: string; callbackSession?: string; tamper?: boolean } = {}) {
  const session = options.session ? `lily_session=${options.session}` : "";
  const startUrl = `${BASE}/start${options.session ? "?mode=link" : ""}`;
  const started = await invokeHandler(start.onRequestGet, env, { url: startUrl, headers: { Cookie: session } });
  const google = new URL(started.headers.get("Location") as string);
  let oauthCookie = (started.headers.get("Set-Cookie") as string).split(";")[0];
  if (options.tamper) oauthCookie = oauthCookie.replace(/\.-\./, ".attacker-target.");
  const finalSession = options.callbackSession ? `lily_session=${options.callbackSession}` : session;
  const payload = {
    iss: "https://accounts.google.com",
    aud: "client-1",
    exp: Math.floor(Date.now() / 1000) + 300,
    nonce: google.searchParams.get("nonce"),
    sub: "google-sub-1",
    email: "Ann@Example.com",
    email_verified: true,
    name: "Añn",
    ...claims,
  };
  const idToken = `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id_token: idToken })));
  vi.stubGlobal("fetch", fetchMock);
  const state = options.state ?? google.searchParams.get("state");
  const res = await invokeHandler(callback.onRequestGet, env, {
    url: `${BASE}/callback?code=abc&state=${state}`,
    headers: { Cookie: [oauthCookie, finalSession].filter(Boolean).join("; ") },
  });
  return { res, google, fetchMock, location: res.headers.get("Location") };
}

const sessionFrom = (res: Response) => res.headers.get("Set-Cookie")?.match(/lily_session=([^;]+)/)?.[1];
const countUsers = async (env: Env) => (await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>())?.n;
const registerAnn = async (env: Env) => {
  const res = await invokeHandler(register.onRequestPost, env, {
    method: "POST",
    body: { email: "ann@example.com", display_name: "Ann", password: "password123" },
  });
  return (await res.json()) as { session_token: string; user: { id: string; workspace_id: string } };
};

describe("Google sign-in", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates one account, signs it in again, and blocks password login for it", async () => {
    const env = buildEnv();
    const first = await runFlow(env);
    expect(first.google.searchParams.get("scope")).toBe("openid email profile");
    expect(first.google.searchParams.get("redirect_uri")).toBe(`${BASE}/callback`);
    expect(first.location).toBe("/dashboard");
    const profile = await invokeHandler(me.onRequestGet, env, { headers: { Cookie: `lily_session=${sessionFrom(first.res)}` } });
    expect(await profile.json()).toMatchObject({ email: "ann@example.com", display_name: "Añn" });
    expect((await runFlow(env)).location).toBe("/dashboard");
    expect(await countUsers(env)).toBe(1);
    const password = await invokeHandler(login.onRequestPost, env, { method: "POST", body: { email: "ann@example.com", password: "google-only" } });
    expect(password.status).toBe(401);
  });

  it("never auto-links a matching email, but links from a signed-in session", async () => {
    const env = buildEnv();
    const ann = await registerAnn(env);
    const blocked = await runFlow(env);
    expect(blocked.location).toBe("/login?google_error=google_account_exists");
    expect(sessionFrom(blocked.res)).toBeUndefined();
    expect((await runFlow(env, {}, { session: ann.session_token })).location).toBe("/settings?google=connected");
    const signedIn = await runFlow(env);
    expect(signedIn.location).toBe("/dashboard");
    expect(await countUsers(env)).toBe(1);
    const other = await runFlow(env, { sub: "google-sub-2" }, { session: ann.session_token });
    expect(other.location).toBe("/settings?google_error=google_already_linked");
  });

  it("rejects a bad state without contacting Google", async () => {
    const env = buildEnv();
    const flow = await runFlow(env, {}, { state: "forged" });
    expect(flow.location).toBe("/login?google_error=google_state_mismatch");
    expect(flow.fetchMock).not.toHaveBeenCalled();
    expect(await countUsers(env)).toBe(0);
  });

  it.each([
    ["aud", "someone-else"],
    ["iss", "https://evil.example"],
    ["nonce", "replayed"],
    ["exp", 1],
    ["email_verified", false],
  ])("rejects a bad %s claim", async (claim, value) => {
    const env = buildEnv();
    const flow = await runFlow(env, { [claim]: value });
    expect(flow.location).toMatch(/^\/login\?google_error=google_(invalid_token|email_unverified)$/);
    expect(sessionFrom(flow.res)).toBeUndefined();
    expect(await countUsers(env)).toBe(0);
  });

  it("rejects a tampered state cookie and a user switch during linking", async () => {
    const env = buildEnv();
    expect((await runFlow(env, {}, { tamper: true })).location).toBe("/login?google_error=google_state_mismatch");
    const ann = await registerAnn(env);
    const bobRes = await invokeHandler(register.onRequestPost, env, {
      method: "POST",
      body: { email: "bob@example.com", display_name: "Bob", password: "password123" },
    });
    const bob = (await bobRes.json()) as { session_token: string };
    const flow = await runFlow(env, {}, { session: ann.session_token, callbackSession: bob.session_token });
    expect(flow.location).toBe("/settings?google_error=google_state_mismatch");
    expect(flow.fetchMock).not.toHaveBeenCalled();
  });

  it("does not treat built-in property names as error codes", () => {
    expect(describeGoogleError("constructor")).toBe("Google sign-in failed. Please try again.");
  });

  it("fails closed without APP_SECRET_KEY and writes nothing", async () => {
    const env: Env = { DB: createMockD1() };
    const res = await invokeHandler(register.onRequestPost, env, {
      method: "POST",
      body: { email: "a@example.com", display_name: "A", password: "password123" },
    });
    expect(res.status).toBe(503);
    expect(await countUsers(env)).toBe(0);
  });

  it("rejects a signed session for a workspace the user does not belong to", async () => {
    const env = buildEnv();
    const ann = await registerAnn(env);
    const token = await createSessionToken(ann.user.id, "someone-elses-workspace", SECRET);
    const res = await invokeHandler(me.onRequestGet, env, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(401);
  });
});
