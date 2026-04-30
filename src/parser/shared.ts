import { getRandomString } from "./utils.ts";

export type UnknownRecord = Record<string, unknown>;

type TlsInput = {
  enabled?: boolean;
  serverName?: unknown;
  insecure?: unknown;
  alpn?: unknown;
  utlsFingerprint?: unknown;
  realityPublicKey?: unknown;
  realityShortId?: unknown;
  echEnabled?: unknown;
  echConfig?: unknown;
  echQueryServerName?: unknown;
};

type TransportInput = {
  type?: unknown;
  path?: unknown;
  host?: unknown;
  headers?: unknown;
  serviceName?: unknown;
  method?: unknown;
  maxEarlyData?: unknown;
  earlyDataHeaderName?: unknown;
};

export function compactObject<T extends UnknownRecord>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => !isEmptyValue(item)),
  ) as T;
}

export function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}

export function booleanFromUnknown(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalizedValue = nonEmptyString(value)?.toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  if (["1", "true", "yes", "on", "tls", "reality"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off", "none"].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

export function numberFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const stringValue = nonEmptyString(value);
  if (!stringValue) {
    return undefined;
  }

  const parsedValue = Number(stringValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function stringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.flatMap((item) =>
      splitCommaList(nonEmptyString(item)) ?? []
    );
    return items.length > 0 ? items : undefined;
  }

  return splitCommaList(nonEmptyString(value));
}

export function readRecord(value: unknown): UnknownRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as UnknownRecord;
}

export function requireString(value: unknown, fieldName: string): string {
  const stringValue = nonEmptyString(value);
  if (!stringValue) {
    throw new Error(`Missing ${fieldName}`);
  }

  return stringValue;
}

export function requireNumber(value: unknown, fieldName: string): number {
  const numberValue = numberFromUnknown(value);
  if (numberValue === undefined) {
    throw new Error(`Missing ${fieldName}`);
  }

  return numberValue;
}

export function buildTag(value: unknown, prefix: string): string {
  return nonEmptyString(value) ?? `${prefix}_${getRandomString(10)}`;
}

export function buildUriTls(
  params: URLSearchParams,
  enabledByDefault: boolean = false,
): UnknownRecord | undefined {
  const security = params.get("security")?.toLowerCase();
  const hasTlsSettings = [
    params.get("sni"),
    params.get("servername"),
    params.get("peer"),
    params.get("alpn"),
    params.get("fp"),
    params.get("allowInsecure"),
    params.get("insecure"),
    params.get("pbk"),
    params.get("sid"),
    params.get("ech"),
    params.get("echConfig"),
    params.get("ech-config"),
    params.get("echQueryServerName"),
    params.get("ech-query-server-name"),
  ].some((value) => value !== null);

  return buildTlsOptions({
    enabled: enabledByDefault || security === "tls" || security === "reality" ||
      hasTlsSettings,
    serverName: params.get("sni") ?? params.get("servername") ??
      params.get("peer"),
    insecure: params.get("allowInsecure") ?? params.get("insecure"),
    alpn: params.get("alpn"),
    utlsFingerprint: params.get("fp"),
    realityPublicKey: params.get("pbk") ?? params.get("publicKey") ??
      params.get("public-key"),
    realityShortId: params.get("sid") ?? params.get("shortId") ??
      params.get("short-id"),
    echEnabled: params.get("ech") || params.get("echConfig") ||
      params.get("ech-config"),
    echConfig: params.get("ech") ?? params.get("echConfig") ??
      params.get("ech-config"),
    echQueryServerName: params.get("echQueryServerName") ??
      params.get("ech-query-server-name"),
  });
}

export function buildClashTls(
  proxy: UnknownRecord,
  enabledByDefault: boolean = false,
): UnknownRecord | undefined {
  const realityOptions = readRecord(proxy["reality-opts"]);
  const echOptions = readRecord(proxy["ech-opts"]);

  return buildTlsOptions({
    enabled: enabledByDefault || booleanFromUnknown(proxy.tls),
    serverName: proxy.servername ?? proxy.sni,
    insecure: proxy["skip-cert-verify"],
    alpn: proxy.alpn,
    utlsFingerprint: proxy["client-fingerprint"],
    realityPublicKey: realityOptions?.["public-key"],
    realityShortId: realityOptions?.["short-id"],
    echEnabled: echOptions?.enable,
    echConfig: echOptions?.config,
    echQueryServerName: echOptions?.["query-server-name"],
  });
}

export function buildUriTransport(
  params: URLSearchParams,
): UnknownRecord | undefined {
  return buildTransport({
    type: params.get("type"),
    path: params.get("path"),
    host: params.get("host"),
    serviceName: params.get("serviceName") ?? params.get("service_name") ??
      params.get("path"),
    method: params.get("method"),
    maxEarlyData: params.get("ed") ?? params.get("max-early-data") ??
      params.get("maxEarlyData"),
    earlyDataHeaderName: params.get("eh") ??
      params.get("early-data-header-name") ?? params.get("earlyDataHeaderName"),
  });
}

export function buildClashTransport(
  proxy: UnknownRecord,
): UnknownRecord | undefined {
  const rawNetwork = nonEmptyString(proxy.network)?.toLowerCase();
  const network = normalizeTransportType(rawNetwork);
  if (!rawNetwork || network === "tcp") {
    return undefined;
  }

  if (network === "ws") {
    const websocketOptions = readRecord(proxy["ws-opts"]);
    const useHttpUpgrade = booleanFromUnknown(
      websocketOptions?.["v2ray-http-upgrade"],
    );
    return buildTransport({
      type: useHttpUpgrade ? "httpupgrade" : "ws",
      path: websocketOptions?.path,
      host: readRecord(websocketOptions?.headers)?.Host,
      headers: websocketOptions?.headers,
      maxEarlyData: websocketOptions?.["max-early-data"],
      earlyDataHeaderName: websocketOptions?.["early-data-header-name"],
    });
  }

  if (rawNetwork === "http") {
    const httpOptions = readRecord(proxy["http-opts"]);
    return buildTransport({
      type: "http",
      path: firstPath(httpOptions?.path),
      method: httpOptions?.method,
      headers: httpOptions?.headers,
    });
  }

  if (rawNetwork === "h2") {
    const http2Options = readRecord(proxy["h2-opts"]);
    return buildTransport({
      type: "http",
      path: firstPath(http2Options?.path),
      host: http2Options?.host,
    });
  }

  if (network === "grpc") {
    const grpcOptions = readRecord(proxy["grpc-opts"]);
    return buildTransport({
      type: "grpc",
      serviceName: grpcOptions?.["grpc-service-name"],
    });
  }

  if (network === "quic") {
    return buildTransport({ type: "quic" });
  }

  return buildTransport({ type: network });
}

export function networkFromUdpFlag(proxy: UnknownRecord): string | undefined {
  return booleanFromUnknown(proxy.udp) === false ? "tcp" : undefined;
}

export function parsePacketEncoding(
  ...values: Array<unknown>
): string | undefined {
  for (const value of values) {
    const packetEncoding = nonEmptyString(value);
    if (packetEncoding === "packetaddr" || packetEncoding === "xudp") {
      return packetEncoding;
    }
  }

  return undefined;
}

export function parseBandwidth(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const stringValue = nonEmptyString(value);
  if (!stringValue) {
    return undefined;
  }

  const match = stringValue.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

export function parseHopInterval(
  value: unknown,
): { hop_interval?: string; hop_interval_max?: string } {
  const stringValue = nonEmptyString(value);
  if (!stringValue) {
    return {};
  }

  const rangeMatch = stringValue.match(
    /^(\d+(?:\.\d+)?)(ms|s|m|h)?-(\d+(?:\.\d+)?)(ms|s|m|h)?$/i,
  );
  if (rangeMatch) {
    return {
      hop_interval: `${rangeMatch[1]}${rangeMatch[2] ?? "s"}`,
      hop_interval_max: `${rangeMatch[3]}${
        rangeMatch[4] ?? rangeMatch[2] ?? "s"
      }`,
    };
  }

  if (/^\d+(?:\.\d+)?$/i.test(stringValue)) {
    return { hop_interval: `${stringValue}s` };
  }

  return { hop_interval: stringValue };
}

export function parseServerPorts(value: unknown): string[] | undefined {
  return stringArray(value);
}

export function pluginOptionsToString(value: unknown): string | undefined {
  const stringValue = nonEmptyString(value);
  if (stringValue) {
    return stringValue;
  }

  const recordValue = readRecord(value);
  if (!recordValue) {
    return undefined;
  }

  const entries = Object.entries(recordValue)
    .map(([key, item]) => {
      if (Array.isArray(item)) {
        const listValue = item
          .map((entry) => nonEmptyString(entry))
          .filter((entry): entry is string => entry !== undefined)
          .join(",");
        return listValue ? `${key}=${listValue}` : undefined;
      }

      if (typeof item === "boolean" || typeof item === "number") {
        return `${key}=${item}`;
      }

      const scalarValue = nonEmptyString(item);
      return scalarValue ? `${key}=${scalarValue}` : undefined;
    })
    .filter((entry): entry is string => entry !== undefined);

  return entries.length > 0 ? entries.join(";") : undefined;
}

export function parsePluginField(
  value: unknown,
): { plugin?: string; plugin_opts?: string } {
  const pluginField = nonEmptyString(value);
  if (!pluginField) {
    return {};
  }

  const [pluginName, ...pluginOptions] = pluginField.split(";");
  return compactObject({
    plugin: pluginName,
    plugin_opts: pluginOptions.length > 0 ? pluginOptions.join(";") : undefined,
  });
}

function buildTlsOptions(input: TlsInput): UnknownRecord | undefined {
  const realityPublicKey = nonEmptyString(input.realityPublicKey);
  const echConfig = nonEmptyString(input.echConfig);
  const echQueryServerName = nonEmptyString(input.echQueryServerName);
  const tlsEnabled = Boolean(
    input.enabled || realityPublicKey || echConfig || echQueryServerName,
  );

  if (!tlsEnabled) {
    return undefined;
  }

  return compactObject({
    enabled: true,
    server_name: nonEmptyString(input.serverName),
    insecure: booleanFromUnknown(input.insecure),
    alpn: stringArray(input.alpn),
    utls: buildUtlsOptions(input.utlsFingerprint),
    reality: realityPublicKey
      ? compactObject({
        enabled: true,
        public_key: realityPublicKey,
        short_id: nonEmptyString(input.realityShortId),
      })
      : undefined,
    ech: echConfig || echQueryServerName || booleanFromUnknown(input.echEnabled)
      ? compactObject({
        enabled: true,
        config: echConfig ? [echConfig] : undefined,
        query_server_name: echQueryServerName,
      })
      : undefined,
  });
}

function buildUtlsOptions(value: unknown): UnknownRecord | undefined {
  const fingerprint = nonEmptyString(value);
  if (!fingerprint) {
    return undefined;
  }

  return {
    enabled: true,
    fingerprint: normalizeUtlsFingerprint(fingerprint),
  };
}

function buildTransport(input: TransportInput): UnknownRecord | undefined {
  const transportType = normalizeTransportType(input.type);
  if (!transportType || transportType === "tcp") {
    return undefined;
  }

  if (
    ["kcp", "mkcp", "ds", "domainsocket", "xhttp", "splithttp"].includes(
      transportType,
    )
  ) {
    throw new Error(`Unsupported transport type: ${transportType}`);
  }

  if (transportType === "http") {
    return compactObject({
      type: "http",
      host: stringArray(input.host),
      path: firstPath(input.path),
      method: nonEmptyString(input.method),
      headers: normalizeHeaders(input.headers),
    });
  }

  if (transportType === "ws") {
    const websocketHeaders = normalizeHeaders(input.headers) ?? {};
    const websocketHost = firstHost(input.host);
    if (websocketHost && websocketHeaders.Host === undefined) {
      websocketHeaders.Host = websocketHost;
    }

    return compactObject({
      type: "ws",
      path: firstPath(input.path),
      headers: websocketHeaders,
      max_early_data: numberFromUnknown(input.maxEarlyData),
      early_data_header_name: nonEmptyString(input.earlyDataHeaderName),
    });
  }

  if (transportType === "grpc") {
    return compactObject({
      type: "grpc",
      service_name: nonEmptyString(input.serviceName),
    });
  }

  if (transportType === "httpupgrade") {
    return compactObject({
      type: "httpupgrade",
      host: firstHost(input.host),
      path: firstPath(input.path),
      headers: normalizeHeaders(input.headers),
    });
  }

  if (transportType === "quic") {
    return { type: "quic" };
  }

  throw new Error(`Unsupported transport type: ${transportType}`);
}

function normalizeHeaders(value: unknown): UnknownRecord | undefined {
  const headers = readRecord(value);
  if (!headers) {
    return undefined;
  }

  const normalizedHeaders: Array<[string, string | string[]]> = [];

  for (const [key, item] of Object.entries(headers)) {
    if (Array.isArray(item)) {
      const items = item
        .map((entry) => nonEmptyString(entry))
        .filter((entry): entry is string => entry !== undefined);
      if (items.length > 0) {
        normalizedHeaders.push([key, items]);
      }
      continue;
    }

    if (typeof item === "boolean" || typeof item === "number") {
      normalizedHeaders.push([key, String(item)]);
      continue;
    }

    const stringValue = nonEmptyString(item);
    if (stringValue) {
      normalizedHeaders.push([key, stringValue]);
    }
  }

  return normalizedHeaders.length > 0
    ? Object.fromEntries(normalizedHeaders)
    : undefined;
}

function normalizeTransportType(value: unknown): string | undefined {
  const transportType = nonEmptyString(value)?.toLowerCase();
  if (!transportType) {
    return undefined;
  }

  if (transportType === "h2") {
    return "http";
  }

  if (transportType === "httpupgrade" || transportType === "http-upgrade") {
    return "httpupgrade";
  }

  return transportType;
}

function normalizeUtlsFingerprint(value: string): string {
  const normalizedValue = value.trim();
  if (normalizedValue.toLowerCase() === "ios") {
    return "ios";
  }

  return normalizedValue === "360"
    ? normalizedValue
    : normalizedValue.toLowerCase();
}

function splitCommaList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function firstPath(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return nonEmptyString(value[0]);
  }

  return nonEmptyString(value);
}

function firstHost(value: unknown): string | undefined {
  return stringArray(value)?.[0];
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as UnknownRecord).length === 0;
  }

  return false;
}
