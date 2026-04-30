import {
  booleanFromUnknown,
  buildTag,
  buildUriTls,
  buildUriTransport,
  compactObject,
  nonEmptyString,
  numberFromUnknown,
  parsePacketEncoding,
  requireNumber,
  requireString,
  type UnknownRecord,
} from "./shared.ts";
import { decodeBase64 } from "./utils.ts";

export function parseVmess(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(decodeBase64(raw.substring(8))) as UnknownRecord;
  const tlsMode = nonEmptyString(parsed.tls)?.toLowerCase();
  const tlsParams = new URLSearchParams();
  const transportParams = new URLSearchParams();

  setParam(tlsParams, "security", tlsMode);
  setParam(
    tlsParams,
    "sni",
    parsed.sni ?? parsed.serverName ?? parsed.server_name,
  );
  setParam(tlsParams, "alpn", parsed.alpn);
  setParam(tlsParams, "fp", parsed.fp);
  setParam(tlsParams, "allowInsecure", parsed.allowInsecure ?? parsed.insecure);
  setParam(
    tlsParams,
    "pbk",
    parsed.pbk ?? parsed.publicKey ?? parsed.public_key,
  );
  setParam(tlsParams, "sid", parsed.sid ?? parsed.shortId ?? parsed.short_id);
  setParam(
    tlsParams,
    "ech",
    parsed.ech ?? parsed.echConfig ?? parsed.ech_config,
  );

  setParam(transportParams, "type", parsed.net ?? parsed.network);
  setParam(transportParams, "path", parsed.path);
  setParam(transportParams, "host", parsed.host);
  setParam(
    transportParams,
    "serviceName",
    parsed.serviceName ?? parsed.service_name,
  );
  setParam(transportParams, "method", parsed.method);
  setParam(
    transportParams,
    "ed",
    parsed.ed ?? parsed.maxEarlyData ?? parsed.max_early_data,
  );
  setParam(
    transportParams,
    "eh",
    parsed.eh ?? parsed.earlyDataHeaderName ?? parsed.early_data_header_name,
  );

  return compactObject({
    type: "vmess",
    tag: buildTag(parsed.ps, "vmess"),
    server: requireString(parsed.add, "server"),
    server_port: requireNumber(parsed.port, "port"),
    uuid: requireString(parsed.id, "uuid"),
    security: nonEmptyString(parsed.scy) ?? nonEmptyString(parsed.cipher) ??
      "auto",
    alter_id: numberFromUnknown(parsed.aid) ??
      numberFromUnknown(parsed.alterId) ?? 0,
    global_padding: booleanFromUnknown(
      parsed.globalPadding ?? parsed.global_padding ?? parsed["global-padding"],
    ),
    authenticated_length: booleanFromUnknown(
      parsed.authenticatedLength ??
        parsed.authenticated_length ??
        parsed["authenticated-length"],
    ),
    packet_encoding: parsePacketEncoding(
      parsed.packetEncoding,
      parsed.packet_encoding,
      parsed["packet-encoding"],
    ),
    tls: buildUriTls(tlsParams),
    transport: buildUriTransport(transportParams),
  });
}

function setParam(
  params: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (Array.isArray(value)) {
    const serializedValue = value
      .map((item) => nonEmptyString(item))
      .filter((item): item is string => item !== undefined)
      .join(",");

    if (serializedValue) {
      params.set(key, serializedValue);
    }
    return;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    params.set(key, String(value));
    return;
  }

  const stringValue = nonEmptyString(value);
  if (stringValue) {
    params.set(key, stringValue);
  }
}
