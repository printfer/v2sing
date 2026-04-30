import {
  buildTag,
  buildUriTls,
  buildUriTransport,
  compactObject,
  nonEmptyString,
  parsePacketEncoding,
} from "./shared.ts";

export function parseVless(raw: string): Record<string, unknown> {
  const url = new URL(raw);
  const params = url.searchParams;

  if (!url.port) {
    throw new Error("Missing port");
  }

  return compactObject({
    type: "vless",
    tag: buildTag(decodeURIComponent(url.hash.substring(1)), "vless"),
    server: url.hostname,
    server_port: Number(url.port),
    uuid: decodeURIComponent(url.username),
    flow: nonEmptyString(params.get("flow")),
    packet_encoding: parsePacketEncoding(
      params.get("packet-encoding"),
      params.get("packetEncoding"),
      params.get("encryption"),
    ),
    tls: buildUriTls(params),
    transport: buildUriTransport(params),
  });
}
