import {
  buildTag,
  buildUriTls,
  buildUriTransport,
  compactObject,
  normalizeServerAddress,
  requireString,
  safeDecodeURIComponent,
} from "./shared.ts";

export function parseTrojan(raw: string): Record<string, unknown> {
  const url = new URL(raw);
  const params = url.searchParams;

  if (!url.port) {
    throw new Error("Missing port");
  }

  return compactObject({
    type: "trojan",
    tag: buildTag(safeDecodeURIComponent(url.hash.substring(1)), "trojan"),
    server: normalizeServerAddress(url.hostname),
    server_port: Number(url.port),
    password: requireString(
      url.password
        ? `${safeDecodeURIComponent(url.username)}:${
          safeDecodeURIComponent(url.password)
        }`
        : safeDecodeURIComponent(url.username),
      "password",
    ),
    tls: buildUriTls(params, true),
    transport: buildUriTransport(params),
  });
}
