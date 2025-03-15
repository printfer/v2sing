import { decodeBase64, getRandomString, isBase64 } from "./utils.ts";

type Shadowsocks = {
  type: "shadowsocks";
  tag: string;
  server: string;
  server_port: number;
  method: string;
  password: string;
};

export function parseShadowsocks(raw: string): Shadowsocks {
  // Remove the `ss://` prefix from the input string
  const url = raw.substring(5);

  // Split the main content from the fragment (`#`) to extract the optional tag
  const [mainContent, tagFragment] = url.split("#");
  const tag = decodeURIComponent(tagFragment || "");

  // Determine if the main content is Base64-encoded (a common format for Shadowsocks URIs)
  const mainInfo = isBase64(mainContent)
    ? decodeBase64(mainContent)
    : mainContent;

  // Split credentials and server information using `@`
  const [encodedCredentials, serverInfo] = mainInfo.split("@");

  // Decode the Base64-encoded credentials (method:password)
  const decodedCredentials = decodeBase64(encodedCredentials);
  const [method, password] = decodedCredentials.split(":");

  // Extract the server address and port number
  const [server, port] = serverInfo.split(":");

  return Object.fromEntries(
    Object.entries({
      type: "shadowsocks",
      tag: tag || `shadowsocks_${getRandomString(10)}`, // Use provided tag or generate a random one
      server,
      server_port: parseInt(port, 10), // Convert port to an integer
      method,
      password,
    }).filter(([_, v]) => v !== null && v !== undefined),
  ) as Shadowsocks;
}
