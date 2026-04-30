import { parse as parseYaml } from "@std/yaml";
import {
  booleanFromUnknown,
  buildClashTls,
  buildClashTransport,
  buildTag,
  compactObject,
  networkFromUdpFlag,
  nonEmptyString,
  numberFromUnknown,
  parseBandwidth,
  parseHopInterval,
  parsePacketEncoding,
  parsePluginField,
  parseServerPorts,
  pluginOptionsToString,
  readRecord,
  requireNumber,
  requireString,
  type UnknownRecord,
} from "./shared.ts";

export function parseClashSubscription(subscription: string): {
  proxies: Record<string, unknown>[];
  failedLines: { line: string; error: string }[];
} {
  const parsedSubscription = parseYaml(subscription);
  const clashConfig = readRecord(parsedSubscription);
  const proxies = clashConfig?.proxies;

  if (!Array.isArray(proxies)) {
    throw new Error("Clash subscription does not contain a proxies list");
  }

  const parsedProxies: Record<string, unknown>[] = [];
  const failedLines: { line: string; error: string }[] = [];

  for (const proxy of proxies) {
    const clashProxy = readRecord(proxy);
    if (!clashProxy) {
      failedLines.push({
        line: JSON.stringify(proxy),
        error: "Invalid Clash proxy definition",
      });
      continue;
    }

    try {
      parsedProxies.push(parseClashProxy(clashProxy));
    } catch (error) {
      failedLines.push({
        line: JSON.stringify(clashProxy),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { proxies: parsedProxies, failedLines };
}

function parseClashProxy(proxy: UnknownRecord): Record<string, unknown> {
  const protocol = requireString(proxy.type, "proxy type").toLowerCase();

  if (protocol === "vmess") {
    return parseClashVmess(proxy);
  }

  if (protocol === "vless") {
    return parseClashVless(proxy);
  }

  if (protocol === "ss" || protocol === "shadowsocks") {
    return parseClashShadowsocks(proxy);
  }

  if (protocol === "trojan") {
    return parseClashTrojan(proxy);
  }

  if (protocol === "hysteria2" || protocol === "hy2") {
    return parseClashHysteria2(proxy);
  }

  throw new Error(`Unsupported Clash proxy type: ${protocol}`);
}

function parseClashVmess(proxy: UnknownRecord): Record<string, unknown> {
  return compactObject({
    type: "vmess",
    tag: buildTag(proxy.name, "vmess"),
    server: requireString(proxy.server, "server"),
    server_port: requireNumber(proxy.port, "port"),
    uuid: requireString(proxy.uuid, "uuid"),
    security: nonEmptyString(proxy.cipher) ?? "auto",
    alter_id: numberFromUnknown(proxy.alterId) ?? 0,
    global_padding: booleanFromUnknown(proxy["global-padding"]),
    authenticated_length: booleanFromUnknown(proxy["authenticated-length"]),
    packet_encoding: parsePacketEncoding(proxy["packet-encoding"]),
    network: networkFromUdpFlag(proxy),
    tls: buildClashTls(proxy),
    transport: buildClashTransport(proxy),
  });
}

function parseClashVless(proxy: UnknownRecord): Record<string, unknown> {
  return compactObject({
    type: "vless",
    tag: buildTag(proxy.name, "vless"),
    server: requireString(proxy.server, "server"),
    server_port: requireNumber(proxy.port, "port"),
    uuid: requireString(proxy.uuid, "uuid"),
    flow: nonEmptyString(proxy.flow),
    packet_encoding: parsePacketEncoding(
      proxy["packet-encoding"],
      proxy.encryption,
    ),
    network: networkFromUdpFlag(proxy),
    tls: buildClashTls(proxy),
    transport: buildClashTransport(proxy),
  });
}

function parseClashShadowsocks(proxy: UnknownRecord): Record<string, unknown> {
  const pluginField = parsePluginField(proxy.plugin);
  const pluginOptions = pluginOptionsToString(proxy["plugin-opts"]);

  return compactObject({
    type: "shadowsocks",
    tag: buildTag(proxy.name, "shadowsocks"),
    server: requireString(proxy.server, "server"),
    server_port: requireNumber(proxy.port, "port"),
    method: requireString(proxy.cipher, "cipher"),
    password: requireString(proxy.password, "password"),
    plugin: pluginField.plugin,
    plugin_opts: pluginOptions ?? pluginField.plugin_opts,
    network: networkFromUdpFlag(proxy),
    udp_over_tcp: booleanFromUnknown(proxy["udp-over-tcp"]) ??
      booleanFromUnknown(proxy.uot),
  });
}

function parseClashTrojan(proxy: UnknownRecord): Record<string, unknown> {
  return compactObject({
    type: "trojan",
    tag: buildTag(proxy.name, "trojan"),
    server: requireString(proxy.server, "server"),
    server_port: requireNumber(proxy.port, "port"),
    password: requireString(proxy.password, "password"),
    network: networkFromUdpFlag(proxy),
    tls: buildClashTls(proxy, true),
    transport: buildClashTransport(proxy),
  });
}

function parseClashHysteria2(proxy: UnknownRecord): Record<string, unknown> {
  const serverPorts = parseServerPorts(proxy.ports);
  const hopInterval = parseHopInterval(proxy["hop-interval"]);

  return compactObject({
    type: "hysteria2",
    tag: buildTag(proxy.name, "hysteria2"),
    server: requireString(proxy.server, "server"),
    server_port: serverPorts ? undefined : requireNumber(proxy.port, "port"),
    server_ports: serverPorts,
    ...hopInterval,
    up_mbps: parseBandwidth(proxy.up),
    down_mbps: parseBandwidth(proxy.down),
    password: requireString(proxy.password, "password"),
    bbr_profile: nonEmptyString(proxy["bbr-profile"]),
    network: networkFromUdpFlag(proxy),
    tls: buildClashTls(proxy, true),
    obfs: nonEmptyString(proxy.obfs)
      ? compactObject({
        type: nonEmptyString(proxy.obfs),
        password: nonEmptyString(proxy["obfs-password"]),
      })
      : undefined,
  });
}
