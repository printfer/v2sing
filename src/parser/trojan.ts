import {
  buildTag,
  buildUriTls,
  buildUriTransport,
  compactObject,
} from "./shared.ts";

export function parseTrojan(raw: string): Record<string, unknown> {
  const url = new URL(raw);
  const params = url.searchParams;

  if (!url.port) {
    throw new Error("Missing port");
  }

  return compactObject({
    type: "trojan",
    tag: buildTag(decodeURIComponent(url.hash.substring(1)), "trojan"),
    server: url.hostname,
    server_port: Number(url.port),
    password: url.password
      ? `${decodeURIComponent(url.username)}:${
        decodeURIComponent(url.password)
      }`
      : decodeURIComponent(url.username),
    tls: buildUriTls(params, true),
    transport: buildUriTransport(params),
  });
}
