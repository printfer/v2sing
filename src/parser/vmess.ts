import { decodeBase64, getRandomString } from "./utils.ts";

type Vmess = {
  type: "vmess";
  tag: string;
  server: string;
  server_port: number;
  uuid: string;
  security: string;
  alter_id: number;
  tls?: {
    enabled: boolean;
    server_name?: string;
  };
  transport?: {
    type: string;
    path?: string;
    service_name?: string;
    headers?: {
      Host: string;
    };
  };
};

export function parseVmess(raw: string): Vmess {
  // Remove "vmess://" and decode
  const parsed = JSON.parse(decodeBase64(raw.substring(8)));

  // Extracting TLS if applicable
  const tls = parsed.tls === "tls"
    ? {
      enabled: true,
      server_name: parsed.sni,
    }
    : undefined;

  // Extracting transport and headers only if not TCP
  let transport: Vmess["transport"] | undefined;
  if (parsed.net !== "tcp") {
    transport = {
      type: parsed.net,
    };

    if (parsed.net === "grpc") {
      transport.service_name = parsed.path;
    } else {
      transport.path = parsed.path;

      // Add headers only if the Host parameter exists
      const host = parsed.host;
      if (host) {
        transport.headers = { Host: host };
      }
    }
  }

  return Object.fromEntries(
    Object.entries({
      type: "vmess",
      tag: parsed.ps || `vmess_${getRandomString(10)}`,
      server: parsed.add,
      server_port: parseInt(parsed.port, 10),
      uuid: parsed.id,
      security: parsed.scy,
      alter_id: parseInt(parsed.aid, 10),
      tls,
      transport,
    }).filter(([_, v]) => v !== null && v !== undefined),
  ) as Vmess;
}
