import {
  booleanFromUnknown,
  buildTag,
  compactObject,
  nonEmptyString,
  normalizeServerAddress,
  parsePluginField,
  requireString,
  safeDecodeURIComponent,
} from "./shared.ts";
import { decodeBase64 } from "./utils.ts";

export function parseShadowsocks(raw: string): Record<string, unknown> {
  const urlWithoutScheme = raw.substring(5);
  const [contentWithoutFragment, rawTag = ""] = urlWithoutScheme.split("#", 2);
  const [mainContent, queryString = ""] = contentWithoutFragment.split("?", 2);

  let credentialsPart: string;
  let serverPart: string;

  if (mainContent.includes("@")) {
    const separatorIndex = mainContent.lastIndexOf("@");
    credentialsPart = mainContent.substring(0, separatorIndex);
    serverPart = mainContent.substring(separatorIndex + 1);
  } else {
    const decodedMainContent = decodeBase64(mainContent);
    const separatorIndex = decodedMainContent.lastIndexOf("@");
    if (separatorIndex === -1) {
      throw new Error("Invalid shadowsocks URI");
    }

    credentialsPart = decodedMainContent.substring(0, separatorIndex);
    serverPart = decodedMainContent.substring(separatorIndex + 1);
  }

  const credentials = decodeCredentials(credentialsPart);
  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("Invalid shadowsocks credentials");
  }

  const serverUrl = new URL(`ss://${serverPart}`);
  if (!serverUrl.port) {
    throw new Error("Missing port");
  }

  const queryParams = new URLSearchParams(queryString);
  const pluginField = parsePluginField(queryParams.get("plugin"));

  return compactObject({
    type: "shadowsocks",
    tag: buildTag(safeDecodeURIComponent(rawTag), "shadowsocks"),
    server: normalizeServerAddress(serverUrl.hostname),
    server_port: Number(serverUrl.port),
    method: requireString(credentials.substring(0, separatorIndex), "method"),
    password: requireString(
      credentials.substring(separatorIndex + 1),
      "password",
    ),
    plugin: pluginField.plugin,
    plugin_opts: nonEmptyString(queryParams.get("plugin-opts")) ??
      nonEmptyString(queryParams.get("plugin_opts")) ??
      pluginField.plugin_opts,
    udp_over_tcp: booleanFromUnknown(
      queryParams.get("udp-over-tcp") ?? queryParams.get("uot"),
    ),
  });
}

function decodeCredentials(value: string): string {
  const decodedValue = safeDecodeURIComponent(value);
  if (decodedValue.includes(":")) {
    return decodedValue;
  }

  return decodeBase64(value);
}
