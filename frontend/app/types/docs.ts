export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type EndpointAuthLevel =
  | "Public"
  | "Human Session"
  | "Human or API Key (read)"
  | "Human or API Key (read+write)";

export interface EndpointParamSpec {
  name: string;
  location: "path" | "query" | "body";
  required: boolean;
  type: string;
  description: string;
}

export interface EndpointDocItem {
  id: string;
  group: string;
  method: HttpMethod;
  path: string;
  title: string;
  summary: string;
  auth: EndpointAuthLevel;
  params: EndpointParamSpec[];
  sampleQuery?: string;
  sampleBody?: Record<string, unknown>;
  sampleResponse: Record<string, unknown> | unknown[];
}
