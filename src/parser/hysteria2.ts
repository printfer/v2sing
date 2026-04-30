import {
  buildTag,
  buildUriTls,
  compactObject,
  networkFromUdpFlag,
  nonEmptyString,
  parseBandwidth,
  parseHopInterval,
  parseServerPorts,
} from "./shared.ts";

export function parseHysteria2(raw: string): Record<string, unknown> {
  const url = new URL(raw);
  const params = url.searchParams;
  const serverPorts = parseServerPorts(
    params.get("ports") ?? params.get("server_ports") ?? params.get("mport"),
  );

  if (!serverPorts && !url.port) {
    throw new Error("Missing port");
  }

  return compactObject({
    type: "hysteria2",
    tag: buildTag(decodeURIComponent(url.hash.substring(1)), "hysteria2"),
    server: url.hostname,
    server_port: serverPorts ? undefined : Number(url.port),
    server_ports: serverPorts,
    ...parseHopInterval(
      params.get("hop-interval") ?? params.get("hop_interval"),
    ),
    up_mbps: parseBandwidth(params.get("up")),
    down_mbps: parseBandwidth(params.get("down")),
    password: url.password
      ? `${decodeURIComponent(url.username)}:${
        decodeURIComponent(url.password)
      }`
      : decodeURIComponent(url.username),
    bbr_profile: nonEmptyString(
      params.get("bbr-profile") ?? params.get("bbr_profile"),
    ),
    network: networkFromUdpFlag({ udp: params.get("udp") }),
    tls: buildUriTls(params, true),
    obfs: params.get("obfs")
      ? compactObject({
        type: nonEmptyString(params.get("obfs")),
        password: nonEmptyString(
          params.get("obfs-password") ?? params.get("obfs_password"),
        ),
      })
      : undefined,
  });
}
