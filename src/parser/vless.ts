import { getRandomString } from "./utils.ts";

export type Vless = {
  type: "vless";
  tag: string;
  server: string;
  server_port: number;
  uuid: string;
  tls?: {
    enabled: boolean;
    server_name?: string;
  };
  packet_encoding?: string;
  transport?: {
    type: string;
    path?: string;
    service_name?: string;
    headers?: {
      Host: string;
    };
  };
};

export function parseVless(raw: string): Vless {
  const url = new URL(raw);
  const params = url.searchParams;

  // Extracting the tag from the fragment (#)
  const tag = decodeURIComponent(url.hash.substring(1));

  // Extracting TLS if applicable
  const tls = params.get("security") === "tls"
    ? {
      enabled: true,
      server_name: params.get("sni"),
    }
    : undefined;

  // Extracting transport and headers
  let transport: Vless["transport"] | undefined;
  const transportType = params.get("type") || "tcp";

  if (transportType !== "tcp") {
    transport = {
      type: transportType,
    };

    if (transportType === "grpc") {
      transport.service_name = decodeURIComponent(params.get("path") || "");
    } else {
      transport.path = decodeURIComponent(params.get("path") || "");

      // Add headers only if the Host parameter exists
      const host = params.get("host");
      if (host) {
        transport.headers = { Host: host };
      }
    }
  }

  // Handling packet_encoding logic
  const rawPacketEncoding = params.get("encryption");
  const packetEncoding =
    rawPacketEncoding === "packetaddr" || rawPacketEncoding === "xudp"
      ? rawPacketEncoding
      : undefined;

  return Object.fromEntries(
    Object.entries({
      type: "vless",
      tag: tag ? tag : `vless_${getRandomString(10)}`,
      server: url.hostname,
      server_port: parseInt(url.port, 10),
      uuid: url.username,
      packet_encoding: packetEncoding,
      tls: tls,
      transport: transport,
    }).filter(([_, v]) => v !== null && v !== undefined),
  ) as Vless;
}
