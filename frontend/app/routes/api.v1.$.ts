import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";

import { dispatchApiV1 } from "../../functions/_lib/router/dispatchApiV1";
import type { Env } from "../../functions/_lib/types/env";

function getCloudflareEnv(context: unknown): Env | undefined {
  return (context as { cloudflare?: { env?: Env } } | undefined)?.cloudflare?.env;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  return dispatchApiV1(request, getCloudflareEnv(context));
}

export async function action({ request, context }: ActionFunctionArgs) {
  return dispatchApiV1(request, getCloudflareEnv(context));
}
