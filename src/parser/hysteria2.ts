import { getRandomString } from "./utils.ts";

type Hysteria2 = {
  type: "hysteria2";
  tag: string;
  server: string;
  server_port: number;
  password: string;
  tls: {
    enabled: boolean;
    server_name?: string;
    insecure?: boolean;
  };
  obfs?: {
    type: string;
    password?: string;
  };
};

export function parseHysteria2(raw: string): Hysteria2 {
  // Remove the `hysteria2://` or `hy2://` prefix
  const url = raw.startsWith("hysteria2://")
    ? raw.substring(12)
    : raw.substring(6);

  // Extract tag (server alias)
  const [mainContent, tagFragment] = url.split("#");
  const tag = decodeURIComponent(tagFragment);

  // Extract query parameters
  const [authServerPart, queryString] = mainContent.split("?");
  const queryParams = new URLSearchParams(queryString || "");

  // Extract authentication credentials and server details safely
  const [auth, serverInfo = ""] = authServerPart.split("@");
  const [server, portStr] = serverInfo.split(":");

  // Extract optional settings
  const sni = queryParams.get("sni");
  const insecure = queryParams.get("insecure") === "1";
  const obfs = queryParams.get("obfs");
  const obfs_password = queryParams.get("obfs-password");

  // Construct output JSON structure
  return Object.fromEntries(
    Object.entries({
      type: "hysteria2",
      tag: tag || `hysteria2_${getRandomString(10)}`,
      server,
      server_port: parseInt(portStr, 10),
      password: auth,
      tls: {
        enabled: true,
        ...(sni && { server_name: sni }),
        ...(insecure && { insecure: true }),
      },
      ...(obfs && {
        obfs: {
          type: obfs,
          ...(obfs_password && { password: obfs_password }),
        },
      }),
    }).filter(([_, v]) => v !== null && v !== undefined),
  ) as Hysteria2;
}
