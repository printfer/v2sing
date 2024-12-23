import { getRandomString } from "./utils.ts";

export type Trojan = {
  type: "trojan";
  tag: string;
  server: string;
  server_port: number;
  password: string;
  tls: {
    enabled: boolean;
    server_name?: string;
  };
};

export function parseTrojan(raw: string): Trojan {
  // Remove the `trojan://` prefix
  const url = raw.substring(9);

  // Split the main content from the fragment (#) for the tag
  const [mainContent, tagFragment] = url.split("#");
  const tag = decodeURIComponent(tagFragment || "");

  // Extract password and server info
  const [passwordWithServer, serverInfo] = mainContent.split("@");
  const [password] = passwordWithServer.split(":"); // Password is before the `:`
  const [server, port] = serverInfo.split(":");

  // Extract query parameters
  const params = new URLSearchParams(serverInfo.split("?")[1] || "");

  return {
    type: "trojan",
    tag: tag ? tag : `trojan_${getRandomString(10)}`,
    server: server,
    server_port: parseInt(port, 10),
    password: password,
    tls: {
      enabled: params.get("security") === "tls",
      server_name: params.get("sni") || "",
    },
  };
}
