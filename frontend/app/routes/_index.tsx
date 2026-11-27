import { redirect } from "@remix-run/cloudflare";

export function loader() {
  return redirect("/dashboard");
}

export default function IndexRoute() {
  return null;
}
