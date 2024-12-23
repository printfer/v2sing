import { decodeBase64, getRandomString } from "./utils.ts";

type Shadowsocks = {
  type: "shadowsocks";
  tag: string;
  server: string;
  server_port: number;
  method: string;
  password: string;
};

export function parseShadowsocks(raw: string): Shadowsocks {
  // Remove the `ss://` prefix
  const url = raw.substring(5);

  // Split the main content from the fragment (#) for the tag
  const [mainContent, tagFragment] = url.split("#");
  const tag = decodeURIComponent(tagFragment || "");

  // The main content might be encoded in base64
  const [encodedCredentials, serverInfo] = mainContent.split("@");
  const decodedCredentials = decodeBase64(encodedCredentials);
  const [method, password] = decodedCredentials.split(":");

  // Extract server and port
  const [server, port] = serverInfo.split(":");

  return {
    type: "shadowsocks",
    tag: tag ? tag : `trojan_${getRandomString(10)}`,
    server: server,
    server_port: parseInt(port, 10),
    method: method,
    password: password,
  };
}
