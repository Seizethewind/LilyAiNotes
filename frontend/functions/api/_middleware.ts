import { errorResponse } from "../_lib/http/errorResponse";
import type { Env } from "../_lib/types/env";

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    return await context.next();
  } catch (err) {
    return errorResponse(err);
  }
};
